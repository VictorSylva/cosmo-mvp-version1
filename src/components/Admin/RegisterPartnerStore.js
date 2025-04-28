import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';

const RegisterPartnerStore = () => {
  const [formData, setFormData] = useState({
    storeName: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    contactPerson: '',
    accountName: '',
    accountNumber: '',
    bankName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Create the partner store document
      await setDoc(doc(db, 'users', user.uid), {
        storeName: formData.storeName,
        email: formData.email,
        address: formData.address,
        phone: formData.phone,
        contactPerson: formData.contactPerson,
        isPartnerStore: true,
        createdAt: new Date(),
        role: 'partner',
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName
      });

      // Clear the form
      setFormData({
        storeName: '',
        email: '',
        password: '',
        address: '',
        phone: '',
        contactPerson: '',
        accountName: '',
        accountNumber: '',
        bankName: ''
      });

      setSuccess('Partner store registered successfully!');
    } catch (error) {
      console.error('Error registering partner store:', error);
      setError(error.message);
    }

    setIsLoading(false);
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: '20px'
      }}>Register New Partner Store</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label 
              htmlFor="storeName"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}
            >
              Store Name
            </label>
            <input
              id="storeName"
              name="storeName"
              type="text"
              required
              value={formData.storeName}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="address"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}
            >
              Address
            </label>
            <textarea
              id="address"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                minHeight: '80px'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="phone"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}
            >
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="contactPerson"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}
            >
              Contact Person
            </label>
            <input
              id="contactPerson"
              name="contactPerson"
              type="text"
              required
              value={formData.contactPerson}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label
              htmlFor="accountName"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}
            >
              Account Name
            </label>
            <input
              id="accountName"
              name="accountName"
              type="text"
              required
              value={formData.accountName}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label
              htmlFor="accountNumber"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}
            >
              Account Number
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              type="text"
              required
              value={formData.accountNumber}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label
              htmlFor="bankName"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}
            >
              Bank Name
            </label>
            <input
              id="bankName"
              name="bankName"
              type="text"
              required
              value={formData.bankName}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f0fdf4',
            color: '#059669',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '10px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Registering...' : 'Register Partner Store'}
        </button>
      </form>
    </div>
  );
};

export default RegisterPartnerStore; 