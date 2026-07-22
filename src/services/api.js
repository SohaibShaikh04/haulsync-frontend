import axios from 'axios'

// Strip trailing slash so baseURL never becomes "https://...onrender.com//api"
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://haulsync-backend.onrender.com').replace(/\/$/, '')

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

export const planTrip = async ({ currentLocation, pickupLocation, dropoffLocation, cycleUsedHours }) => {
  const response = await api.post('/trips/plan', {
    current_location: {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      name: currentLocation.name,
    },
    pickup_location: {
      lat: pickupLocation.lat,
      lng: pickupLocation.lng,
      name: pickupLocation.name,
    },
    dropoff_location: {
      lat: dropoffLocation.lat,
      lng: dropoffLocation.lng,
      name: dropoffLocation.name,
    },
    cycle_used_hours: parseFloat(cycleUsedHours) || 0,
  })
  return response.data
}

export default api
