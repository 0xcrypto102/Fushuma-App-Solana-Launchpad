export default defineAppConfig({
  toaster: {
    position: "top-right" as const,
    expand: false,
    duration: 5000,
  },
  theme: {
    radius: 0.25,
    blackAsPrimary: false,
  },
  ui: {
    colors: {
      primary: "green",
      neutral: "slate",
    },
  },
})
