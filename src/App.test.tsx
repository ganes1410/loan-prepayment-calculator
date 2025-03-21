import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";

describe("Loan Prepayment Calculator", () => {
  beforeEach(() => {
    render(<App />);
  });

  it("renders all input fields correctly", () => {
    expect(screen.getByLabelText(/principal amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/interest rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan tenure \(years\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan start date/i)).toBeInTheDocument();
    expect(screen.getByTestId("emi-display")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /calculate prepayment benefits/i })
    ).toBeInTheDocument();
  });

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

  it("calculates EMI when loan details are entered", async () => {
    const principalInput = screen.getByLabelText(/principal amount/i);
    const interestRateInput = screen.getByLabelText(/interest rate/i);
    const tenureInput = screen.getByLabelText(/loan tenure \(years\)/i);

    fireEvent.change(principalInput, { target: { value: "1000000" } });
    fireEvent.change(interestRateInput, { target: { value: "8.5" } });
    fireEvent.change(tenureInput, { target: { value: "20" } });

    const emiDisplay = await screen.findByTestId("emi-display");
    expect(emiDisplay.textContent).not.toBe("");
  });

  it("adds and removes prepayments", async () => {
    const addButton = screen.getByText(/add prepayment/i);
    fireEvent.click(addButton);

    expect(
      screen.getByPlaceholderText(/enter prepayment amount/i)
    ).toBeInTheDocument();

    const removeButton = screen.getByText(/remove/i);
    fireEvent.click(removeButton);

    expect(
      screen.queryByPlaceholderText(/enter prepayment amount/i)
    ).not.toBeInTheDocument();
  });

  it("validates loan details before calculation", () => {
    const calculateButton = screen.getByText(/calculate prepayment benefits/i);
    fireEvent.click(calculateButton);

    expect(screen.queryByText(/total savings/i)).not.toBeInTheDocument();
  });

  it("calculates savings for multiple prepayments correctly", async () => {
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

    await waitFor(() => {
      expect(screen.getByText(/Total Savings/i)).toBeInTheDocument();
      expect(screen.getByText(/Final EMI/i)).toBeInTheDocument();
      expect(screen.getByText(/Loan Tenure Reduction/i)).toBeInTheDocument();
    });
  });

  it("calculates correct EMI reduction after prepayment", async () => {
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
    const prepaymentAmount = screen.getByPlaceholderText(
      /Enter prepayment amount/i
    );
    fireEvent.change(prepaymentAmount, { target: { value: "500000" } });

    fireEvent.click(screen.getByText(/Calculate Prepayment Benefits/i));

    await waitFor(() => {
      const finalEMI = screen.getByTestId("final-emi");
      const initialEMI = screen.getByTestId("emi-display");

      expect(finalEMI.textContent).not.toBe(initialEMI.textContent);
      expect(
        Number(finalEMI.textContent?.replace(/[^\d.-]/g, "") ?? "0")
      ).toBeLessThan(
        Number(initialEMI.textContent?.replace(/[^\d.-]/g, "") ?? "0")
      );
    });
  });
});
