import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";

const PartnerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [partnerStores, setPartnerStores] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // 'all', 'pending', 'approved', 'completed'
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grouped'
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
    fetchPartnerStores();
  }, [filter]);

  const fetchPartnerStores = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("isPartnerStore", "==", true));
      const querySnapshot = await getDocs(q);

      const storesMap = {};
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        storesMap[doc.id] = {
          id: doc.id,
          storeName: data.storeName,
          email: data.email,
          contactPerson: data.contactPerson,
          phone: data.phone,
          address: data.address,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          bankName: data.bankName,
        };
      });

      setPartnerStores(storesMap);
    } catch (error) {
      console.error("Error fetching partner stores:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const paymentsRef = collection(db, "payments");
      let q;

      if (filter === "all") {
        q = query(paymentsRef, orderBy("createdAt", "desc"));
      } else {
        q = query(
          paymentsRef,
          where("status", "==", filter),
          orderBy("createdAt", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      const paymentsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        processedAt: doc.data().processedAt
          ? new Date(doc.data().processedAt)
          : null,
      }));

      setPayments(paymentsData);
    } catch (error) {
      window.showToast?.('Error fetching payments: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (paymentId, status) => {
    try {
      const paymentRef = doc(db, "payments", paymentId);
      await updateDoc(paymentRef, {
        status,
        processedAt: new Date().toISOString(),
        processedBy: auth.currentUser?.uid,
      });
      window.showToast?.(`Payment ${status} successfully`, 'success');
      fetchPayments();
    } catch (error) {
      window.showToast?.('Error processing payment: ' + error.message, 'error');
    }
  };

  const bulkCompletePaymentsByStore = async (partnerId) => {
    try {
      const storePayments = payments.filter(
        (payment) =>
          payment.partnerID === partnerId && payment.status === "approved"
      );

      if (storePayments.length === 0) {
        window.showToast?.('No approved payments found for this store', 'warning');
        return;
      }

      const confirmed = await window.showConfirm?.(
        `Complete all ${storePayments.length} approved payments for ${
          partnerStores[partnerId]?.storeName || "this store"
        }?`
      );

      if (!confirmed) return;

      const updatePromises = storePayments.map((payment) =>
        updateDoc(doc(db, "payments", payment.id), {
          status: "completed",
          processedAt: new Date().toISOString(),
          processedBy: auth.currentUser?.uid,
        })
      );

      await Promise.all(updatePromises);
      window.showToast?.(`Successfully completed ${storePayments.length} payments for ${partnerStores[partnerId]?.storeName}`, 'success');
      fetchPayments();
    } catch (error) {
      window.showToast?.('Error completing payments: ' + error.message, 'error');
    }
  };

  const fixCompletedPayments = async () => {
    try {
      const paymentsRef = collection(db, "payments");
      const q = query(paymentsRef, where("status", "==", "completed"));
      const querySnapshot = await getDocs(q);

      let updatedCount = 0;
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (!data.processedAt) {
          await updateDoc(doc.ref, {
            processedAt: data.createdAt?.toDate?.() || new Date(),
            processedBy: "system-fix",
          });
          updatedCount++;
        }
      }

      window.showToast?.(`Fixed ${updatedCount} completed payments that were missing processedAt field`, 'success');
      fetchPayments();
    } catch (error) {
      window.showToast?.('Error fixing payments: ' + error.message, 'error');
    }
  };

  const fixPendingPayments = async () => {
    try {
      const paymentsRef = collection(db, "payments");
      const q = query(paymentsRef, where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);

      let updatedCount = 0;
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        // Check if this payment was created after the fix (should be pending)
        // If it has processedAt field, it was incorrectly marked as completed
        if (data.processedAt) {
          await updateDoc(doc.ref, {
            status: "pending",
            processedAt: null,
            processedBy: null,
          });
          updatedCount++;
        }
      }

      window.showToast?.(`Fixed ${updatedCount} payments that were incorrectly marked as completed`, 'success');
      fetchPayments();
    } catch (error) {
      window.showToast?.('Error fixing pending payments: ' + error.message, 'error');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return date.toLocaleString();
  };

  // Group payments by store
  const getGroupedPayments = () => {
    const grouped = {};
    payments.forEach((payment) => {
      const partnerId = payment.partnerID;
      if (!grouped[partnerId]) {
        grouped[partnerId] = {
          store: partnerStores[partnerId] || { storeName: "Unknown Store" },
          payments: [],
          totals: {
            totalPrepaid: 0,
            totalFinal: 0,
            totalDifference: 0,
            approvedCount: 0,
            pendingCount: 0,
            completedCount: 0,
            totalToPay: 0, // Total amount to pay store (sum of store amounts for unpaid items)
            totalPaid: 0, // Total amount already paid (sum of store amounts for completed items)
          },
        };
      }

      grouped[partnerId].payments.push(payment);
      grouped[partnerId].totals.totalPrepaid += payment.prepaidPrice || 0;
      grouped[partnerId].totals.totalFinal += payment.finalPrice || 0;
      grouped[partnerId].totals.totalDifference += payment.priceDifference || 0;

      // Calculate totals based on payment status
      if (payment.status === "completed") {
        // For completed payments, track total paid
        grouped[partnerId].totals.totalPaid += payment.finalPrice || 0;
        grouped[partnerId].totals.completedCount++;
      } else {
        // For pending/approved payments, track total to pay
        grouped[partnerId].totals.totalToPay += payment.finalPrice || 0;

        if (payment.status === "approved") {
          grouped[partnerId].totals.approvedCount++;
        } else if (payment.status === "pending") {
          grouped[partnerId].totals.pendingCount++;
        }
      }
    });

    return grouped;
  };

  return (
    <div className="p-4 md:p-6">
      <button
        onClick={() => navigate("/admin/dashboard")}
        style={{
          backgroundColor: "#3b82f6",
          color: "white",
          padding: "8px 16px",
          borderRadius: "6px",
          border: "none",
          marginBottom: "16px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Back to Admin Dashboard
      </button>
      <h1 className="text-2xl font-bold mb-6">Partner Store Payments</h1>

      <div className="mb-6 flex gap-2 items-center flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "approved", "completed"].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded ${
                filter === filterType
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border"
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-0 md:ml-4 mt-2 md:mt-0 items-center">
          <span className="text-sm text-gray-600 self-center">View:</span>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === "list"
                ? "bg-gray-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("grouped")}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === "grouped"
                ? "bg-gray-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            By Store
          </button>
        </div>

        <button
          onClick={fixCompletedPayments}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 ml-0 md:ml-4 mt-2 md:mt-0"
        >
          Fix Completed Payments
        </button>
        <button
          onClick={fixPendingPayments}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-0 md:ml-2 mt-2 md:mt-0"
        >
          Fix Incorrectly Completed
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {viewMode === "list" ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="responsive-table-wrapper">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product & Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Prepaid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Store Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Difference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Processed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">
                            {payment.productName}
                          </div>
                          <div className="text-gray-500">
                            Quantity: {payment.quantity || 1}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {payment.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">
                            {partnerStores[payment.partnerID]?.storeName ||
                              "Unknown Store"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {partnerStores[payment.partnerID]?.email ||
                              "No email"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {payment.quantity && payment.quantity > 1
                            ? `${formatCurrency(
                                payment.unitPrepaidPrice || payment.prepaidPrice
                              )} × ${payment.quantity} = ${formatCurrency(
                                payment.prepaidPrice
                              )}`
                            : formatCurrency(payment.prepaidPrice)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {payment.quantity && payment.quantity > 1
                            ? `${formatCurrency(
                                payment.unitFinalPrice || payment.finalPrice
                              )} × ${payment.quantity} = ${formatCurrency(
                                payment.finalPrice
                              )}`
                            : formatCurrency(payment.finalPrice)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium">
                            {formatCurrency(payment.priceDifference)}
                          </div>
                          {payment.quantity && payment.quantity > 1 && (
                            <div className="text-xs text-gray-500">
                              (Unit:{" "}
                              {formatCurrency(
                                payment.unitPriceDifference ||
                                  payment.priceDifference / payment.quantity
                              )}
                              )
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              payment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : payment.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {payment.processedAt
                            ? formatDate(payment.processedAt)
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {payment.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  processPayment(payment.id, "approved")
                                }
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  processPayment(payment.id, "rejected")
                                }
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {payment.status === "approved" && (
                            <button
                              onClick={() =>
                                processPayment(payment.id, "completed")
                              }
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(getGroupedPayments()).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No payments found
                </div>
              ) : (
                Object.entries(getGroupedPayments()).map(
                  ([partnerId, storeData]) => (
                    <div
                      key={partnerId}
                      className="bg-white rounded-lg shadow overflow-hidden"
                    >
                      <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {storeData.store.storeName}
                            </h3>
                            <div className="text-sm text-gray-600">
                              {storeData.store.email} •{" "}
                              {storeData.store.contactPerson}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {storeData.store.accountName &&
                                `${storeData.store.accountName} • `}
                              {storeData.store.accountNumber &&
                                `${storeData.store.accountNumber} • `}
                              {storeData.store.bankName}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {formatCurrency(storeData.totals.totalToPay)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {storeData.totals.totalToPay > 0
                                ? "Total to Pay Store"
                                : "All Payments Completed"}
                            </div>
                            {storeData.totals.totalPaid > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                {formatCurrency(storeData.totals.totalPaid)}{" "}
                                already paid
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {storeData.totals.completedCount} completed •{" "}
                              {storeData.totals.approvedCount} approved •{" "}
                              {storeData.totals.pendingCount} pending
                            </div>
                            {storeData.totals.approvedCount > 0 && (
                              <button
                                onClick={() =>
                                  bulkCompletePaymentsByStore(partnerId)
                                }
                                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                              >
                                Complete All Approved
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Product
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Prepaid
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Store Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Difference
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {storeData.payments.map((payment) => (
                              <tr key={payment.id}>
                                <td className="px-6 py-4 text-sm">
                                  <div className="font-medium text-gray-900">
                                    {payment.productName}
                                  </div>
                                  <div className="text-gray-500">
                                    Qty: {payment.quantity || 1}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  {formatCurrency(payment.prepaidPrice)}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  {formatCurrency(payment.finalPrice)}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                  {formatCurrency(payment.priceDifference)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      payment.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : payment.status === "approved"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {payment.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {payment.status === "pending" && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          processPayment(payment.id, "approved")
                                        }
                                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          processPayment(payment.id, "rejected")
                                        }
                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                  {payment.status === "approved" && (
                                    <button
                                      onClick={() =>
                                        processPayment(payment.id, "completed")
                                      }
                                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                    >
                                      Complete
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PartnerPayments;
