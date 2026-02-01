/**
 * AppUser model class
 */
export class AppUser {
  constructor (data = {}) {
    this.id = data.id || null
    this.fullName = data.fullName || ''
    this.email = data.email || ''
    this.role = data.role || null
    this.createdAt = data.createdAt || null
  }

  /**
   * Role constants
   */
  static get ROLES () {
    return {
      ADMIN: 20,
      ATTENDEE: 40,
    }
  }

  /**
   * Check if user is admin
   */
  isAdmin () {
    return this.role === AppUser.ROLES.ADMIN
  }

  /**
   * Get role name as string
   */
  getRoleName () {
    switch (this.role) {
      case AppUser.ROLES.ADMIN: {
        return 'Admin'
      }
      case AppUser.ROLES.ATTENDEE: {
        return 'Attendee'
      }
      default: {
        return 'Unknown'
      }
    }
  }

  /**
   * Check if user has admin privileges
   */
  hasAdminPrivileges () {
    return this.isAdmin()
  }

  /**
   * Validates the user data
   */
  validate () {
    const errors = []

    if (!this.email || this.email.trim().length === 0) {
      errors.push('Email is required')
    }

    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Invalid email format')
    }

    if (this.email && this.email.length > 255) {
      errors.push('Email must be 255 characters or less')
    }

    if (this.fullName && this.fullName.length > 255) {
      errors.push('Full name must be 255 characters or less')
    }

    if (this.role && ![AppUser.ROLES.ADMIN, AppUser.ROLES.ATTENDEE].includes(this.role)) {
      errors.push('Invalid role')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Simple email validation
   */
  isValidEmail (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Returns a plain object (for API requests/responses)
   */
  toJSON () {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt,
    }
  }
}
