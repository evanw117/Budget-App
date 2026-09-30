import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Dashboard } from "@/components/dashboard/dashboard";
import { mockDashboard } from "@/lib/mock/dashboard";

describe("accessible UI foundations", () => {
  it("labels inputs and links validation feedback", () => {
    render(<Input id="email" label="Email" error="Enter a valid email" />);
    expect(
      screen.getByRole("textbox", { name: "Email" }),
    ).toHaveAccessibleDescription("Enter a valid email");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });
  it("does not invoke disabled buttons", async () => {
    const click = vi.fn();
    render(
      <Button disabled onClick={click}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(click).not.toHaveBeenCalled();
  });
  it("announces loading and errors", () => {
    render(
      <>
        <LoadingState />
        <ErrorState message="Please retry" />
        <EmptyState title="No accounts" description="Add one later" />
      </>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(screen.getByRole("alert")).toHaveTextContent("Please retry");
    expect(screen.getByRole("heading", { name: "No accounts" })).toBeVisible();
  });
  it("identifies sample data and exposes goal progress without relying on color", () => {
    render(<Dashboard data={mockDashboard} />);
    expect(screen.getByText(/Sample data/)).toBeVisible();
    expect(
      screen.getByRole("progressbar", { name: "Emergency fund" }),
    ).toHaveAttribute("aria-valuenow", "68");
    expect(screen.getByRole("table")).toHaveAccessibleName(
      "Sample recent transactions in US dollars",
    );
  });
});
