# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.0] - 2025-04-23
### Added

#### **Authentication**
- Implemented user authentication for three roles:
  - **Admin**: Full access to manage patients, doctors, medicines, and vitals.
  - **Volunteer**: Access to their forms for filling in patient data.
- Role-based access control to ensure secure and restricted access to resources.

#### **Patient Management**
- **CRUD Operations**:
  - Create, read, update, and delete patient records.
  - Validation for patient details (e.g., book number must be positive).
- **Patient History**:
  - Track patient visits with timestamps.
  - Store details of assigned doctors, prescribed medicines, and given medicines.
  - Automatically create a new history entry if it doesn’t exist for the current month.
- **Vitals Integration**:
  - Link vitals data (e.g., BP, RBS, height, weight, pulse) to patient history.
  - Ensure vitals are only added if the patient exists and has a valid history entry for the current month.

#### **Doctor Management**
- **CRUD Operations**:
  - Create, read, update, and delete doctor records.
  - Validation for doctor details (e.g., availability status).
- **Doctor Assignment**:
  - Assign doctors to patients based on availability.
  - Replace previously assigned doctors for a specific visit.
  - Log doctor assignments and replacements for audit purposes.

#### **Medicine Management**
- **CRUD Operations**:
  - Create, read, update, and delete medicines and their batches.
  - Validation for medicine details (e.g., expiry date format, batch quantity).
- **Medicine Categories**:
  - Fetch medicine categories from the `medicine_category` database.
  - Display medicine categories in the `ViewMedicines` page.
  - Default category set to "Uncategorized" if no category is found.
- **Expired Medicines**:
  - Filter expired medicines in the inventory.
  - Display expired batches with details (e.g., expiry date, quantity).

#### **Vitals Management**
- **Validation**:
  - Ensure `bp` is in the format `num/num` (e.g., `120/80`).
  - Ensure `book_no` is a positive number.
  - Ensure `rbs`, `height`, `weight`, and `pulse` are positive numbers.
- **Integration with Patient History**:
  - Vitals can only be added if the patient exists and has a valid history entry for the current month.
- **Update and Logging**:
  - Update existing vitals for the current month.
  - Log changes to vitals (e.g., updated BP, RBS, etc.).

#### **Frontend Features**
- **React-Based UI**:
  - Built a responsive and user-friendly interface using React.
  - Pages for managing patients, doctors, medicines, and vitals.
- **Responsive Design**:
  - Optimized for different screen sizes and devices.

#### **Logging**
- Implemented logging for user actions:
  - Log doctor assignments and replacements.
  - Log updates to vitals, including details of what changed.
  - Log creation of new patient history entries.

#### **Backend API**
- **RESTful Endpoints**:
  - APIs for managing patients, doctors, medicines, and vitals.
  - Endpoints for fetching medicine categories and deleting medicine batches.
- **Validation**:
  - Backend validation for all fields (e.g., `book_no`, `bp`, `expiry_date`).
- **Error Handling**:
  - Return appropriate error messages for invalid inputs or missing resources.

---

## How to Update the Changelog

1. **Add a New Version**:
   - When releasing a new version, create a new section with the version number and release date.
   - Use the following format:
     ```
     ## [Version Number] - YYYY-MM-DD
     ### Added
     - List of new features or additions.
     ### Changed
     - List of changes or updates.
     ### Fixed
     - List of bug fixes.
     ```

2. **Unreleased Section**:
   - Use the `[Unreleased]` section to document changes that are not yet released.

3. **Semantic Versioning**:
   - Follow [Semantic Versioning](https://semver.org/) for version numbers:
     - `MAJOR.MINOR.PATCH`
     - Example: `1.0.1` (Major version 1, minor version 0, patch 1).

---

