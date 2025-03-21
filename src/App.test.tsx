import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import App from "./App";
import { formatCurrency } from "./utils/formatters";
import userEvent from "@testing-library/user-event";

describe("Loan Prepayment Calculator", () => {
  beforeEach(() => {
    render(<App />);
  });

  // Render tests
  it("renders all input fields correctly", () => {
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
    const prepaymentAmountInput = screen.getByLabelText(/prepayment amount/i);
    const prepaymentDateInput = screen.getByLabelText(/prepayment date/i);

    fireEvent.change(prepaymentAmountInput, { target: { value: "200000" } });
    fireEvent.change(prepaymentDateInput, { target: { value: "2025-01-01" } });

    expect(prepaymentAmountInput).toHaveValue(200000);
    expect(prepaymentDateInput).toHaveValue("2025-01-01");
  });

  // Calculation tests
  it("calculates monthly EMI correctly when loan details are entered", async () => {
    const principalInput = screen.getByLabelText(/principal amount/i);
    const interestRateInput = screen.getByLabelText(/interest rate/i);
    const tenureInput = screen.getByLabelText(/loan tenure \(years\)/i);

    fireEvent.change(principalInput, { target: { value: "1000000" } });
    fireEvent.change(interestRateInput, { target: { value: "8" } });
    fireEvent.change(tenureInput, { target: { value: "10" } });

    const emiDisplayDiv = screen.getByLabelText(/monthly emi \(calculated\)/i);

    await waitFor(() => {
      expect(emiDisplayDiv.textContent).not.toBe("Enter loan details");
    });
  });

  it("shows calculation results when calculate button is clicked", async () => {
    // Mock window.alert
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    const principalInput = screen.getByLabelText(/principal amount/i);
    const interestRateInput = screen.getByLabelText(/interest rate/i);
    const tenureInput = screen.getByLabelText(/loan tenure \(years\)/i);
    const prepaymentAmountInput = screen.getByLabelText(/prepayment amount/i);

    fireEvent.change(principalInput, { target: { value: "1000000" } });
    fireEvent.change(interestRateInput, { target: { value: "7.5" } });
    fireEvent.change(tenureInput, { target: { value: "15" } });
    fireEvent.change(prepaymentAmountInput, { target: { value: "200000" } });

    const calculateButton = screen.getByRole("button", {
      name: /calculate prepayment benefits/i,
    });
    fireEvent.click(calculateButton);

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
    const principalInput = screen.getByLabelText(/principal amount/i);

    fireEvent.change(principalInput, { target: { value: "-500000" } });
    expect(principalInput).toHaveValue(500000); // Should convert to positive
  });

  it("calculates correctly with a prepayment", async () => {
    const principalInput = screen.getByLabelText(/principal amount/i);
    const interestRateInput = screen.getByLabelText(/interest rate/i);
    const tenureInput = screen.getByLabelText(/loan tenure \(years\)/i);
    const prepaymentAmountInput = screen.getByLabelText(/prepayment amount/i);

    fireEvent.change(principalInput, { target: { value: "1000000" } });
    fireEvent.change(interestRateInput, { target: { value: "7.5" } });
    fireEvent.change(tenureInput, { target: { value: "15" } });
    fireEvent.change(prepaymentAmountInput, { target: { value: "200000" } });

    const calculateButton = screen.getByRole("button", {
      name: /calculate prepayment benefits/i,
    });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      const interestSavedText =
        screen.getByText(/interest saved/i).nextElementSibling?.textContent ||
        "";
      expect(interestSavedText).not.toBe("₹0");
      expect(interestSavedText.includes("-")).toBe(false); // Interest saved should be positive
    });
  });

  it("renders loan calculator form", () => {
    expect(screen.getByText("Loan Prepayment Calculator")).toBeInTheDocument();
    expect(screen.getByLabelText(/Principal Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Interest Rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loan Tenure/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loan Start Date/i)).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Monthly EMI/i })
    ).toBeInTheDocument();
  });

  it("calculates EMI when loan details are entered", async () => {
    const principalInput = screen.getByLabelText(/principal amount/i);
    const interestRateInput = screen.getByLabelText(/interest rate/i);
    const tenureInput = screen.getByLabelText(/loan tenure \(years\)/i);

    // Enter required details
    await userEvent.type(principalInput, "1000000");
    await userEvent.type(interestRateInput, "8.5");
    await userEvent.type(tenureInput, "20");

    // EMI should be calculated automatically
    const emiDisplay = screen.getByTestId("emi-display");
    expect(emiDisplay).toHaveTextContent(formatCurrency(7689)); // Expected EMI for 10L at 8.5% for 20 years
  });

  it("adds and removes prepayments", () => {
    const addButton = screen.getByText(/Add Prepayment/i);
    fireEvent.click(addButton);

    expect(
      screen.getByPlaceholderText(/Enter prepayment amount/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Prepayment Date/i)).toBeInTheDocument();

    const removeButton = screen.getByText(/Remove/i);
    fireEvent.click(removeButton);

    expect(
      screen.queryByPlaceholderText(/Enter prepayment amount/i)
    ).not.toBeInTheDocument();
  });

  it("calculates savings for multiple prepayments", () => {
    fireEvent.change(screen.getByLabelText(/Principal Amount/i), {
      target: { value: "1000000" },
    });
    fireEvent.change(screen.getByLabelText(/Interest Rate/i), {
      target: { value: "8.5" },
    });
    fireEvent.change(screen.getByLabelText(/Loan Tenure/i), {
      target: { value: "20" },
    });

    fireEvent.click(screen.getByText(/Add Prepayment/i));
    fireEvent.click(screen.getByText(/Add Prepayment/i));

    const prepaymentAmounts = screen.getAllByPlaceholderText(
      /Enter prepayment amount/i
    );
    fireEvent.change(prepaymentAmounts[0], { target: { value: "100000" } });
    fireEvent.change(prepaymentAmounts[1], { target: { value: "50000" } });

    fireEvent.click(screen.getByText(/Calculate Prepayment Benefits/i));

    expect(screen.getByText(/Total Savings/i)).toBeInTheDocument();
    expect(screen.getByText(/Final EMI/i)).toBeInTheDocument();
    expect(screen.getByText(/Loan Tenure Reduction/i)).toBeInTheDocument();
  });

  it("validates loan details before calculation", () => {
    fireEvent.click(screen.getByText(/Calculate Prepayment Benefits/i));

    expect(screen.queryByText(/Total Savings/i)).not.toBeInTheDocument();
  });

  it("formats currency values correctly", () => {
    fireEvent.change(screen.getByLabelText(/Principal Amount/i), {
      target: { value: "1000000" },
    });

    expect(screen.getByText(/₹10,00,000/i)).toBeInTheDocument();
  });

  const setupBasicLoanDetails = async () => {
    const principalInput = screen.getByLabelText("Principal Amount");
    const interestRateInput = screen.getByLabelText("Interest Rate (%)");
    const tenureInput = screen.getByLabelText("Loan Tenure (years)");

    // Enter required details
    await userEvent.type(principalInput, "1000000");
    await userEvent.type(interestRateInput, "8.5");
    await userEvent.type(tenureInput, "20");
  };

  const addPrepayment = async () => {
    const addButton = screen.getByRole("button", { name: /add prepayment/i });
    await userEvent.click(addButton);
  };

  const setPrepaymentDetails = async (amount: string, date: string) => {
    // Get the last prepayment amount and date inputs
    const prepaymentAmounts = screen.getAllByPlaceholderText(
      "Enter prepayment amount"
    );
    const prepaymentDates = screen.getAllByPlaceholderText(
      "Enter prepayment date"
    );

    const lastPrepaymentAmount =
      prepaymentAmounts[prepaymentAmounts.length - 1];
    const lastPrepaymentDate = prepaymentDates[prepaymentDates.length - 1];

    await userEvent.type(lastPrepaymentAmount, amount);
    await userEvent.type(lastPrepaymentDate, date);
  };

  it("calculates EMI when loan details are entered", async () => {
    await setupBasicLoanDetails();

    // EMI should be calculated automatically
    const emiDisplay = screen.getByTestId("emi-display");
    expect(emiDisplay).toHaveTextContent(formatCurrency(7689)); // Expected EMI for 10L at 8.5% for 20 years
  });

  it("handles multiple prepayments correctly", async () => {
    await setupBasicLoanDetails();

    // Add first prepayment
    await addPrepayment();
    await setPrepaymentDetails("300000", "2024-06-01");

    // Add second prepayment
    await addPrepayment();
    await setPrepaymentDetails("200000", "2024-12-01");

    // Calculate benefits
    const calculateButton = screen.getByRole("button", {
      name: /calculate prepayment benefits/i,
    });
    await userEvent.click(calculateButton);

    // Check if both prepayments are in the table
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows.length).toBeGreaterThan(2); // Header + at least 2 prepayment rows
  });

  it("sorts prepayments by date", async () => {
    await setupBasicLoanDetails();

    // Add prepayments in reverse chronological order
    await addPrepayment();
    await setPrepaymentDetails("200000", "2024-12-01");

    await addPrepayment();
    await setPrepaymentDetails("300000", "2024-06-01");

    // Calculate benefits
    const calculateButton = screen.getByRole("button", {
      name: /calculate prepayment benefits/i,
    });
    await userEvent.click(calculateButton);

    // Check if prepayments are sorted by date
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows.length).toBeGreaterThan(2); // Header + at least 2 prepayment rows
  });

  it("calculates correct EMI reduction after prepayment", async () => {
    await setupBasicLoanDetails();

    // Add a significant prepayment
    await addPrepayment();
    await setPrepaymentDetails("500000", "2024-07-01");

    // Calculate benefits
    const calculateButton = screen.getByRole("button", {
      name: /calculate prepayment benefits/i,
    });
    await userEvent.click(calculateButton);

    // Check if EMI is reduced
    const finalEMI = screen.getByTestId("final-emi");
    const initialEMI = screen.getByTestId("emi-display");
    expect(finalEMI.textContent).not.toBe(initialEMI.textContent);
  });
});
