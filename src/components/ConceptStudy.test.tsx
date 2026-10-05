import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConceptStudy, { type ConceptKind } from "./ConceptStudy";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("ConceptStudy", () => {
  it.each(["a24", "airbnb", "tesla"] as ConceptKind[])("renders the %s proposal with exactly one moving scene part", kind => {
    const { container } = render(<ConceptStudy kind={kind} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(container.querySelectorAll(".concept-study__moving")).toHaveLength(1);
    expect(screen.getByText("Independent concept · mechanism unverified")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("reveals on a pointer press and resets on release", () => {
    render(<ConceptStudy kind="airbnb" />);
    const button = screen.getByRole("button");
    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("One more place at the table")).toBeInTheDocument();
    fireEvent.pointerUp(button, { pointerId: 1 });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("plays one cycle for keyboard or assistive-technology activation", () => {
    vi.useFakeTimers();
    render(<ConceptStudy kind="a24" />);
    const button = screen.getByRole("button");
    fireEvent.click(button, { detail: 0 });
    expect(button).toHaveAttribute("aria-pressed", "true");
    act(() => vi.advanceTimersByTime(1300));
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("resets an interrupted press and a changed study", () => {
    const { rerender } = render(<ConceptStudy kind="a24" />);
    let button = screen.getByRole("button");
    fireEvent.pointerDown(button, { button: 0 });
    fireEvent.pointerCancel(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button, { detail: 0 });
    rerender(<ConceptStudy kind="tesla" />);
    button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("The useful part of a sunny day")).toBeInTheDocument();
  });

  it("keeps SVG identifiers unique when studies repeat", () => {
    const { container } = render(<><ConceptStudy kind="a24" /><ConceptStudy kind="a24" /></>);
    const ids = Array.from(container.querySelectorAll("[id]")).map(element => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
