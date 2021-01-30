export const month = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

export const emptyRangeStarting = 4;

export const range = (from?: number) => {
  const base = from ?? 0;
  return `A${base + emptyRangeStarting}`;
};

export const fullRange = (from?: number) => {
  return `${range(from)}:F`;
};
