import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import { ThemeProvider } from "../../context/ThemeContext.jsx";

describe("Navbar & Navigation (Integration Test)", () => {
  it("renders brand logo, navigation links, and login route button", () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Navbar />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Verify brand name
    expect(screen.getByText("JobCompass")).toBeInTheDocument();

    // Verify navigation links
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText("Jobs")).toBeInTheDocument();
    expect(screen.getByText("Features")).toBeInTheDocument();

    // Verify Login link exists and points to /login
    const loginLink = screen.getByRole("link", { name: /Login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
