import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConceptStudy, { type ConceptKind } from "./ConceptStudy";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("ConceptStudy", () => {
  it.each(["a24", "airbnb"] as ConceptKind[])("renders the %s proposal with exactly one moving scene part", kind => {
    const { container } = render(<ConceptStudy kind={kind} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(container.querySelectorAll(".concept-study__moving")).toHaveLength(1);
    expect(container.querySelector(".concept-study__electronic-response")).not.toBeInTheDocument();
    expect(screen.getByText("Independent concept · mechanism unverified")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("renders Tesla as one electronic response with no moving mechanical scene part", () => {
    const { container } = render(<ConceptStudy kind="tesla" />);
    expect(screen.getByRole("img", { name: "Stored afternoon: interactive concept study" })).toHaveAccessibleDescription(expect.stringContaining("no connected hardware, network request or AI response"));
    expect(container.querySelectorAll(".concept-study__moving, .concept-study__cap")).toHaveLength(0);
    expect(container.querySelectorAll(".concept-study__electronic-response")).toHaveLength(1);
    expect(container.querySelector(".concept-study__electronic-response")).toHaveAttribute("data-simulation-state", "idle");
    expect(container.querySelectorAll(".concept-study__display")).toHaveLength(1);
    expect(container.querySelectorAll(".concept-study__led")).toHaveLength(1);
    expect(container.querySelector(".concept-study__display-message")).toHaveAttribute("opacity", "0");
    expect(screen.getByText("Illustrated simulation · no live hardware or AI")).toBeInTheDocument();
    expect(screen.getByText("BUTTON / SIMULATED RESPONSE")).toBeInTheDocument();
    expect(screen.queryByText(/WALL PANEL/)).not.toBeInTheDocument();
  });

  it("changes only Tesla's sample display and LED together without a network request", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<ConceptStudy kind="tesla" />);
    const button = screen.getByRole("button", { name: /Try the simulated response/ });
    const response = container.querySelector(".concept-study__electronic-response")!;
    const display = container.querySelector(".concept-study__display")!;
    const message = container.querySelector(".concept-study__display-message")!;
    const led = container.querySelector(".concept-study__led")!;
    const idleDisplay = display.getAttribute("fill");
    const idleLed = led.getAttribute("fill");
    const scenePaths = Array.from(container.querySelectorAll("svg path")).map(path => path.outerHTML);
    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(response).toHaveAttribute("data-simulation-state", "active");
    expect(display).not.toHaveAttribute("fill", idleDisplay);
    expect(led).not.toHaveAttribute("fill", idleLed);
    expect(message).toHaveAttribute("opacity", "1");
    expect(screen.getByText("A stored afternoon, simulated")).toBeInTheDocument();
    expect(Array.from(container.querySelectorAll("svg path")).map(path => path.outerHTML)).toEqual(scenePaths);
    expect(container.querySelector("svg [style*='transform']")).not.toBeInTheDocument();
    fireEvent.pointerUp(button, { pointerId: 1 });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(response).toHaveAttribute("data-simulation-state", "idle");
    expect(display).toHaveAttribute("fill", idleDisplay);
    expect(led).toHaveAttribute("fill", idleLed);
    expect(message).toHaveAttribute("opacity", "0");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["a24", "airbnb"] as ConceptKind[])("moves only the %s scene part on press and resets it on release", kind => {
    const { container } = render(<ConceptStudy kind={kind} />);
    const button = screen.getByRole("button");
    const movingPart = container.querySelector(".concept-study__moving")!;
    const rest = movingPart.getAttribute("style");
    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(movingPart).not.toHaveAttribute("style", rest);
    fireEvent.pointerUp(button, { pointerId: 1 });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(movingPart).toHaveAttribute("style", rest);
  });

  it.each(["a24", "airbnb", "tesla"] as ConceptKind[])("plays one %s cycle for keyboard or assistive-technology activation", kind => {
    vi.useFakeTimers();
    render(<ConceptStudy kind={kind} />);
    const button = screen.getByRole("button");
    fireEvent.click(button, { detail: 0 });
    expect(button).toHaveAttribute("aria-pressed", "true");
    act(() => vi.advanceTimersByTime(1300));
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps one timer on repeated activation and cancels it for a held press", () => {
    vi.useFakeTimers();
    render(<ConceptStudy kind="tesla" />);
    const button = screen.getByRole("button");
    fireEvent.click(button, { detail: 0 });
    act(() => vi.advanceTimersByTime(700));
    fireEvent.click(button, { detail: 0 });
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(700));
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.pointerDown(button, { button: 0 });
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(2000));
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.pointerUp(button);
    fireEvent.click(button, { detail: 1 });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("ignores a secondary-button press", () => {
    vi.stubGlobal("PointerEvent", MouseEvent);
    render(<ConceptStudy kind="tesla" />);
    const button = screen.getByRole("button");
    fireEvent.pointerDown(button, { button: 2 });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it.each(["pointerCancel", "lostPointerCapture", "blur"] as const)("resets an interrupted Tesla response on %s", event => {
    const { container } = render(<ConceptStudy kind="tesla" />);
    const button = screen.getByRole("button");
    fireEvent.pointerDown(button, { button: 0 });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent[event](button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelector(".concept-study__electronic-response")).toHaveAttribute("data-simulation-state", "idle");
  });

  it("resets and clears the previous cycle when the study changes", () => {
    vi.useFakeTimers();
    const { rerender, unmount } = render(<ConceptStudy kind="a24" />);
    fireEvent.click(screen.getByRole("button"), { detail: 0 });
    rerender(<ConceptStudy kind="tesla" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("The useful part of a sunny day")).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(button, { detail: 0 });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps SVG identifiers unique when both kinds of study repeat", () => {
    const { container } = render(<><ConceptStudy kind="a24" /><ConceptStudy kind="a24" /><ConceptStudy kind="tesla" /><ConceptStudy kind="tesla" /></>);
    const ids = Array.from(container.querySelectorAll("[id]")).map(element => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const svg of container.querySelectorAll("svg")) {
      expect(document.getElementById(svg.getAttribute("aria-labelledby")!)).toBeInTheDocument();
      expect(document.getElementById(svg.getAttribute("aria-describedby")!)).toBeInTheDocument();
    }
  });
});
