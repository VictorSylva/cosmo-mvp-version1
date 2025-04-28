import React from "react";
import styled from "styled-components";

const LandingPage = () => {
  return (
    <LandingContainer>
      <NavBar>
        <Logo>CosmoCart</Logo>
        <NavLinks>
          <SignupButton href="/signup">Signup</SignupButton>
          <NavItem href="/login">Login</NavItem>
        </NavLinks>
        <MenuIcon>☰</MenuIcon>
      </NavBar>
      <HeroSection>
        <HeroText>
          Lock in food prices before they rise!  
          <br />  
          Prepay now and enjoy later.  
        </HeroText>
      </HeroSection>
    </LandingContainer>
  );
};

export default LandingPage;

// Styled Components
const LandingContainer = styled.div`
  background: url("/cosmo2.jpg") no-repeat center center/cover;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const NavBar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  position: absolute;
  width: 100%;
  top: 0;
  z-index: 10;
`;

const Logo = styled.h1`
  color: #095859;
  font-size: 30px;
  font-weight: bold;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 20px;
`;

// Styled Signup Button with Thick Red Border
const SignupButton = styled.a`
  background-color: transparent;
  color: white;
  border: 4px solid red; /* Thick red border */
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background-color: red;
    color: white;
  }
`;

const NavItem = styled.a`
  color: white;
  text-decoration: none;
  font-size: 16px;
  &:hover {
    color: #095859;
  }
`;

const MenuIcon = styled.div`
  color: white;
  font-size: 24px;
  cursor: pointer;
`;

const HeroSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const HeroText = styled.h1`
  color: white;
  font-size: 48px;
  font-weight: bold;
`;

