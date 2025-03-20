import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";

describe("Loan Prepayment Calculator", () => {
  // Render tests
  it("renders all input fields correctly", () => {
    render(<App />);

    expect(screen.getByLabelText(/principal amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/interest rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan tenure \(years\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan start date/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/monthly emi \(calculated\)/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/prepayment amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prepayment date/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /calculate prepayment benefits/i })
    ).toBeInTheDocument();
  });

  // Input handling tests
  it("updates loan details when inputs change", () => {
    render(<App />);

    const principalInput = screen.getByLabelText(/principal amount/i);
    const interestRateInput = screen.getByLabelText(/interest rate/i);
    const tenureInput = screen.getByLabelText(/loan tenure \(years\)/i);

    fireEvent.change(principalInput, { target: { value: "1000000" } });
    fireEvent.change(interestRateInput, { target: { value: "7.5" } });
    fireEvent.change(tenureInput, { target: { value: "20" } });

    expect(principalInput).toHaveValue(1000000);
    expect(interestRateInput).toHaveValue(7.5);
    expect(tenureInput).toHaveValue(20);
  });

  it("updates prepayment details when inputs change", () => {
    render(<App />);

    const prepaymentAmountInput = screen.getByLabelText(/prepayment amount/i);
    const prepaymentDateInput = screen.getByLabelText(/prepayment date/i);

    fireEvent.change(prepaymentAmountInput, { target: { value: "200000" } });
    fireEvent.change(prepaymentDateInput, { target: { value: "2025-01-01" } });

    expect(prepaymentAmountInput).toHaveValue(200000);
    expect(prepaymentDateInput).toHaveValue("2025-01-01");
  });

  // Calculation tests
  it("calculates monthly EMI correctly when loan details are entered", async () => {
    render(<App />);

    // Input values
    const principalInput = screen.getByLabelText(/principal amount/i);
    const interestRateInput = screen.getByLabelText(/interest rate/i);
    const tenureInput = screen.getByLabelText(/loan tenure \(years\)/i);

    // Enter loan details
    fireEvent.change(principalInput, { target: { value: "1000000" } });
    fireEvent.change(interestRateInput, { target: { value: "8" } });
    fireEvent.change(tenureInput, { target: { value: "10" } });

    // Check if EMI is calculated
    const emiDisplayDiv = screen.getByLabelText(/monthly emi \(calculated\)/i);

    // Wait for EMI calculation (due to the useEffect hook)
    await waitFor(() => {
      expect(emiDisplayDiv.textContent).not.toBe("Enter loan details");
    });
  });

  it("shows calculation results when calculate button is clicked", async () => {
    // Mock window.alert
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<App />);

    // Input values
    const principalInput = screen.getByLabelText(/principal amount/i);
    const interestRateInput = screen.getByLabelText(/interest rate/i);
    const tenureInput = screen.getByLabelText(/loan tenure \(years\)/i);
    const prepaymentAmountInput = screen.getByLabelText(/prepayment amount/i);

    // Enter required details
    fireEvent.change(principalInput, { target: { value: "1000000" } });
    fireEvent.change(interestRateInput, { target: { value: "7.5" } });
    fireEvent.change(tenureInput, { target: { value: "15" } });
    fireEvent.change(prepaymentAmountInput, { target: { value: "200000" } });

    // Click calculate button
    const calculateButton = screen.getByRole("button", {
      name: /calculate prepayment benefits/i,
    });
    fireEvent.click(calculateButton);

    // Check for results section
    await waitFor(() => {
      expect(screen.getByText(/results/i)).toBeInTheDocument();
      expect(screen.getByText(/interest saved/i)).toBeInTheDocument();
      expect(screen.getByText(/loan tenure reduction/i)).toBeInTheDocument();
      expect(screen.getByText(/amortization schedule/i)).toBeInTheDocument();
    });

    // Cleanup
    alertMock.mockRestore();
  });

  it("validates inputs before calculation", () => {
    // Mock window.alert
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<App />);

    // Click calculate without entering any values
    const calculateButton = screen.getByRole("button", {
      name: /calculate prepayment benefits/i,
    });
    fireEvent.click(calculateButton);

    // Check if alert was called
    expect(alertMock).toHaveBeenCalledWith("Please enter valid loan details");

    // Cleanup
    alertMock.mockRestore();
  });

  // Edge case tests
  it("handles negative numbers by converting them to positive", () => {
    render(<App />);

    const principalInput = screen.getByLabelText(/principal amount/i);

    fireEvent.change(principalInput, { target: { value: "-500000" } });
    expect(principalInput).toHaveValue(500000); // Should convert to positive
  });

  it("calculates correctly with a prepayment", async () => {
    render(<App />);

    // Input values
    const principalInput = screen.getByLabelText(/principal amount/i);
    const interestRateInput = screen.getByLabelText(/interest rate/i);
    const tenureInput = screen.getByLabelText(/loan tenure \(years\)/i);
    const prepaymentAmountInput = screen.getByLabelText(/prepayment amount/i);

    // Enter required details
    fireEvent.change(principalInput, { target: { value: "1000000" } });
    fireEvent.change(interestRateInput, { target: { value: "7.5" } });
    fireEvent.change(tenureInput, { target: { value: "15" } });
    fireEvent.change(prepaymentAmountInput, { target: { value: "200000" } });

    // Click calculate button
    const calculateButton = screen.getByRole("button", {
      name: /calculate prepayment benefits/i,
    });
    fireEvent.click(calculateButton);

    // Check that interest saved is positive
    await waitFor(() => {
      const interestSavedText =
        screen.getByText(/interest saved/i).nextElementSibling?.textContent ||
        "";
      expect(interestSavedText).not.toBe("₹0");
      expect(interestSavedText.includes("-")).toBe(false); // Interest saved should be positive
    });
  });

  it("renders loan calculator form", () => {
    render(<App />);
    expect(screen.getByText("Loan Prepayment Calculator")).toBeInTheDocument();
    expect(screen.getByLabelText(/Principal Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Interest Rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loan Tenure/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loan Start Date/i)).toBeInTheDocument();
  });

  it("calculates EMI when loan details are entered", async () => {
    render(<App />);

    const principalInput = screen.getByLabelText(/Principal Amount/i);
    const interestInput = screen.getByLabelText(/Interest Rate/i);
    const tenureInput = screen.getByLabelText(/Loan Tenure/i);

    fireEvent.change(principalInput, { target: { value: "1000000" } });
    fireEvent.change(interestInput, { target: { value: "10" } });
    fireEvent.change(tenureInput, { target: { value: "20" } });

    await waitFor(() => {
      expect(screen.getByText(/₹8,775/i)).toBeInTheDocument();
    });
  });

  it("allows adding and removing prepayments", async () => {
    render(<App />);

    // Add first prepayment
    const addButton = screen.getByText(/Add Prepayment/i);
    fireEvent.click(addButton);

    const prepaymentAmountInput = screen.getByPlaceholderText(
      /Enter prepayment amount/i
    );
    const prepaymentDateInput = screen.getByLabelText(/Prepayment Date/i);

    fireEvent.change(prepaymentAmountInput, { target: { value: "100000" } });
    fireEvent.change(prepaymentDateInput, { target: { value: "2024-12-31" } });

    // Add second prepayment
    fireEvent.click(addButton);

    const removeButtons = screen.getAllByText(/Remove/i);
    expect(removeButtons).toHaveLength(2);

    // Remove first prepayment
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/Remove/i)).toHaveLength(1);
    });
  });

  it("calculates savings for multiple prepayments", async () => {
    render(<App />);

    // Enter loan details
    const principalInput = screen.getByLabelText(/Principal Amount/i);
    const interestInput = screen.getByLabelText(/Interest Rate/i);
    const tenureInput = screen.getByLabelText(/Loan Tenure/i);

    fireEvent.change(principalInput, { target: { value: "1000000" } });
    fireEvent.change(interestInput, { target: { value: "10" } });
    fireEvent.change(tenureInput, { target: { value: "20" } });

    // Add two prepayments
    const addButton = screen.getByText(/Add Prepayment/i);
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    const prepaymentAmountInputs = screen.getAllByPlaceholderText(
      /Enter prepayment amount/i
    );
    const prepaymentDateInputs = screen.getAllByLabelText(/Prepayment Date/i);

    fireEvent.change(prepaymentAmountInputs[0], {
      target: { value: "100000" },
    });
    fireEvent.change(prepaymentDateInputs[0], {
      target: { value: "2024-12-31" },
    });

    fireEvent.change(prepaymentAmountInputs[1], {
      target: { value: "200000" },
    });
    fireEvent.change(prepaymentDateInputs[1], {
      target: { value: "2025-12-31" },
    });

    // Calculate results
    const calculateButton = screen.getByText(/Calculate Prepayment Benefits/i);
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText(/Total Savings/i)).toBeInTheDocument();
      expect(screen.getByText(/Final EMI/i)).toBeInTheDocument();
      expect(screen.getByText(/New Tenure/i)).toBeInTheDocument();
    });
  });

  it("validates loan details before calculation", async () => {
    render(<App />);

    const calculateButton = screen.getByText(/Calculate Prepayment Benefits/i);
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.queryByText(/Total Savings/i)).not.toBeInTheDocument();
    });
  });

  it("formats currency values correctly", async () => {
    render(<App />);

    const principalInput = screen.getByLabelText(/Principal Amount/i);
    fireEvent.change(principalInput, { target: { value: "1000000" } });

    await waitFor(() => {
      expect(screen.getByText(/₹10,00,000/i)).toBeInTheDocument();
      expect(screen.getByText(/Ten Lakh/i)).toBeInTheDocument();
    });
  });
});
