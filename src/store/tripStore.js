import { create } from 'zustand'

export const useTripStore = create((set) => ({
  // Form state
  currentLocation: { name: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
  pickupLocation: { name: 'Fort Worth, TX', lat: 32.7555, lng: -97.3308 },
  dropoffLocation: { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
  cycleUsedHours: 0,

  // UI state
  isLoading: false,
  loadingStep: 0,
  error: null,

  // Trip result
  tripData: null,
  activeTimelineIndex: null,
  selectedELDDay: 0,
  mapFlyTarget: null,

  // Setters
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  setPickupLocation: (loc) => set({ pickupLocation: loc }),
  setDropoffLocation: (loc) => set({ dropoffLocation: loc }),
  setCycleUsedHours: (hrs) => set({ cycleUsedHours: hrs }),
  setIsLoading: (v) => set({ isLoading: v }),
  setLoadingStep: (s) => set({ loadingStep: s }),
  setError: (e) => set({ error: e }),
  setTripData: (data) => set({ tripData: data }),
  setActiveTimelineIndex: (i) => set({ activeTimelineIndex: i }),
  setSelectedELDDay: (d) => set({ selectedELDDay: d }),
  setMapFlyTarget: (target) => set({ mapFlyTarget: target }),
  resetTrip: () => set({ tripData: null, error: null, activeTimelineIndex: null, selectedELDDay: 0, mapFlyTarget: null }),
}))
