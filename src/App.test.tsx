import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";
import { formatCurrency } from "./utils/formatters";

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
    expect(screen.getByLabelText(/Monthly EMI/i)).toBeInTheDocument();
  });

  it("calculates EMI when loan details are entered", () => {
    render(<App />);

    const principalInput = screen.getByLabelText(/Principal Amount/i);
    const interestInput = screen.getByLabelText(/Interest Rate/i);
    const tenureInput = screen.getByLabelText(/Loan Tenure/i);

    fireEvent.change(principalInput, { target: { value: "1000000" } });
    fireEvent.change(interestInput, { target: { value: "8.5" } });
    fireEvent.change(tenureInput, { target: { value: "20" } });

    // EMI should be calculated automatically
    const emiDisplay = screen.getByLabelText(/Monthly EMI/i);
    expect(emiDisplay).toHaveValue(formatCurrency(7689)); // Expected EMI for 10L at 8.5% for 20 years
  });

  it("adds and removes prepayments", () => {
    render(<App />);

    // Add a prepayment
    const addButton = screen.getByText(/Add Prepayment/i);
    fireEvent.click(addButton);

    // Verify prepayment inputs are added
    expect(
      screen.getByPlaceholderText(/Enter prepayment amount/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Prepayment Date/i)).toBeInTheDocument();

    // Remove the prepayment
    const removeButton = screen.getByText(/Remove/i);
    fireEvent.click(removeButton);

    // Verify prepayment inputs are removed
    expect(
      screen.queryByPlaceholderText(/Enter prepayment amount/i)
    ).not.toBeInTheDocument();
  });

  it("calculates savings for multiple prepayments", () => {
    render(<App />);

    // Enter loan details
    fireEvent.change(screen.getByLabelText(/Principal Amount/i), {
      target: { value: "1000000" },
    });
    fireEvent.change(screen.getByLabelText(/Interest Rate/i), {
      target: { value: "8.5" },
    });
    fireEvent.change(screen.getByLabelText(/Loan Tenure/i), {
      target: { value: "20" },
    });

    // Add two prepayments
    fireEvent.click(screen.getByText(/Add Prepayment/i));
    fireEvent.click(screen.getByText(/Add Prepayment/i));

    // Enter prepayment details
    const prepaymentAmounts = screen.getAllByPlaceholderText(
      /Enter prepayment amount/i
    );
    fireEvent.change(prepaymentAmounts[0], { target: { value: "100000" } });
    fireEvent.change(prepaymentAmounts[1], { target: { value: "50000" } });

    // Calculate results
    fireEvent.click(screen.getByText(/Calculate Prepayment Benefits/i));

    // Verify results are displayed
    expect(screen.getByText(/Total Savings/i)).toBeInTheDocument();
    expect(screen.getByText(/Final EMI/i)).toBeInTheDocument();
    expect(screen.getByText(/Loan Tenure Reduction/i)).toBeInTheDocument();
  });

  it("validates loan details before calculation", () => {
    render(<App />);

    // Try to calculate without entering loan details
    fireEvent.click(screen.getByText(/Calculate Prepayment Benefits/i));

    // Verify results are not displayed
    expect(screen.queryByText(/Total Savings/i)).not.toBeInTheDocument();
  });

  it("formats currency values correctly", () => {
    render(<App />);

    // Enter loan amount
    fireEvent.change(screen.getByLabelText(/Principal Amount/i), {
      target: { value: "1000000" },
    });

    // Verify formatted value is displayed
    expect(screen.getByText(/₹10,00,000/i)).toBeInTheDocument();
  });
});
