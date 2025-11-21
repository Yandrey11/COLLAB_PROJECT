import React from "react";
import { validatePassword } from "../utils/passwordValidation.js";

export default function PasswordStrengthMeter({ password }) {
  const { strength, rules } = validatePassword(password || "");

  const config = {
    Weak: {
      barClass: "bg-red-500",
      labelClass: "text-red-600",
      widthClass: "w-1/3",
    },
    Medium: {
      barClass: "bg-yellow-400",
      labelClass: "text-yellow-600",
      widthClass: "w-2/3",
    },
    Strong: {
      barClass: "bg-emerald-500",
      labelClass: "text-emerald-600",
      widthClass: "w-full",
    },
  }[strength] || {
    barClass: "bg-gray-300",
    labelClass: "text-gray-500",
    widthClass: "w-1/4",
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full ${config.barClass} ${config.widthClass} transition-all duration-200`}
        />
      </div>
      <p className={`text-xs font-medium ${config.labelClass}`}>
        Strength: {strength || "Weak"}
      </p>
      <ul className="mt-1 space-y-0.5 text-xs">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className="flex items-center gap-1"
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                rule.passed ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />
            <span
              className={rule.passed ? "text-emerald-600" : "text-gray-500"}
            >
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
