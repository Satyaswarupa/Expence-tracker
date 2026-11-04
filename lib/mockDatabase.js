// Mock in-memory database for testing OTP flow without MongoDB
// This is TEMPORARY for testing only - DO NOT USE IN PRODUCTION

let users = []
let nextUserId = 1

export const mockDB = {
  // Find one user by query
  findOne: async (query) => {
    if (query._id) {
      return users.find(u => u._id === query._id) || null
    }
    if (query.$or) {
      // Handle $or queries like: { $or: [{ email: ... }, { phone: ... }] }
      return users.find(u => 
        query.$or.some(q => 
          Object.entries(q).every(([k, v]) => u[k] === v)
        )
      ) || null
    }
    // Single field query
    return users.find(u => 
      Object.entries(query).every(([k, v]) => u[k] === v)
    ) || null
  },

  // Create and save a user
  create: async (userData) => {
    const user = {
      _id: `mock_${nextUserId++}`,
      createdAt: new Date(),
      ...userData
    }
    users.push(user)
    return user
  },

  // Save/update a user
  save: async (user) => {
    const index = users.findIndex(u => u._id === user._id)
    if (index === -1) {
      users.push(user)
    } else {
      users[index] = user
    }
    return user
  },

  // Delete all users (for testing)
  clear: () => {
    users = []
    nextUserId = 1
  },

  // Get all users (for debugging)
  getAll: () => [...users]
}

export default mockDB
