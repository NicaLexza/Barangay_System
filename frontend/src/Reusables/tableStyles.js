// Reusables/tableStyles.js
//
// R5: uppercase all table text. CSS-only — the stored/underlying values are
// never transformed, so search, filters and data logic keep using the real
// casing. Spread this into a DataGrid's `sx`.
//
// To turn uppercase OFF everywhere, change the value below to "none".
export const uppercaseGridSx = {
  "& .MuiDataGrid-cell, & .MuiDataGrid-columnHeaderTitle": {
    textTransform: "uppercase",
  },
};