import { MacroKey, MacroTotals, UserGoal, GoalOverride } from "./types";

export interface GoalStatus {
  macro: MacroKey;
  goalType: "min" | "max" | "range";
  target: { min: number | null; max: number | null };
  actual: number;
  met: boolean;
  difference: number;
  severity: "neutral" | "good" | "bad";
}

/**
 * Get the effective goals for a specific date.
 * Priority: goal_overrides > day-of-week goals > default goals (day_of_week = null)
 */
export function getEffectiveGoals(
  goals: UserGoal[],
  overrides: GoalOverride[],
  date: Date
): Map<MacroKey, { goalType: string; min: number | null; max: number | null }> {
  const dayOfWeek = date.getDay();
  const dateStr = date.toISOString().split("T")[0];

  const effective = new Map<MacroKey, { goalType: string; min: number | null; max: number | null }>();

  // 1. Start with defaults (day_of_week = null)
  for (const g of goals) {
    if (g.day_of_week === null) {
      effective.set(g.macro, {
        goalType: g.goal_type,
        min: g.value_min,
        max: g.value_max,
      });
    }
  }

  // 2. Override with day-of-week specific
  for (const g of goals) {
    if (g.day_of_week === dayOfWeek) {
      effective.set(g.macro, {
        goalType: g.goal_type,
        min: g.value_min,
        max: g.value_max,
      });
    }
  }

  // 3. Override with date-specific
  for (const o of overrides) {
    if (o.date === dateStr) {
      effective.set(o.macro, {
        goalType: o.goal_type,
        min: o.value_min,
        max: o.value_max,
      });
    }
  }

  return effective;
}

/**
 * Evaluate all goals against actual macro totals.
 * Returns GoalStatus for each macro that has a goal.
 */
export function evaluateGoals(
  effectiveGoals: Map<MacroKey, { goalType: string; min: number | null; max: number | null }>,
  totals: MacroTotals
): GoalStatus[] {
  const results: GoalStatus[] = [];

  for (const [macro, goal] of effectiveGoals) {
    const actual = totals[macro];
    let met = false;
    let difference = 0;
    let referenceValue = 0;

    switch (goal.goalType) {
      case "min":
        met = actual >= goal.min!;
        difference = actual - goal.min!;
        referenceValue = goal.min!;
        break;
      case "max":
        met = actual <= goal.max!;
        difference = actual - goal.max!;
        referenceValue = goal.max!;
        break;
      case "range":
        met = actual >= goal.min! && actual <= goal.max!;
        if (actual < goal.min!) {
          difference = actual - goal.min!;
          referenceValue = goal.min!;
        } else if (actual > goal.max!) {
          difference = actual - goal.max!;
          referenceValue = goal.max!;
        } else {
          difference = 0;
          referenceValue = (goal.min! + goal.max!) / 2;
        }
        break;
    }

    const percentDiff = referenceValue > 0 ? Math.abs(difference) / referenceValue : 0;
    let severity: "neutral" | "good" | "bad" = "neutral";
    if (percentDiff > 0.1) {
      severity = met ? "good" : "bad";
    }

    results.push({
      macro,
      goalType: goal.goalType as "min" | "max" | "range",
      target: { min: goal.min, max: goal.max },
      actual: Math.round(actual * 10) / 10,
      met,
      difference: Math.round(difference * 10) / 10,
      severity,
    });
  }

  return results;
}
