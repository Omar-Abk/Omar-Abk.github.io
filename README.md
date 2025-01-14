# GraphQL Project README

## Overview
This project is recreation of a dynamic dashboard system of reboot01 system built with HTML, CSS, JavaScript, GraphQL, SVG charts, and JSON Web Tokens (JWT). It enables logged-in users to query and visualize their personal data, offering insights into their progress and skills.

## Features

1. **User Information**
   - Displays basic user details fetched from the GraphQL endpoint.

2. **Recent Projects**
   - Lists the user's most recent projects, providing quick access and an overview of accomplishments.

3. **Progress Stats**
   - Visualizes user progress using a progress bar, showing XP (Experience Points) and audit ratio.

4. **Best Skills**
   - Renders the user's top skills using an SVG radar chart for clear visualization.

5. **Technological Skills**
   - Showcases the user's technological proficiencies with another SVG radar chart.

6. **Logout**
   - Allows the user to securely log out by clicking the logout button.

## Technology Stack
- **Frontend**: HTML, CSS, JavaScript
- **Data Visualization**: SVG charts
- **Authentication**: JSON Web Tokens (JWT)
- **API**: GraphQL endpoint

## How It Works
1. **Authentication**
   - Users log in using JWT for secure access to their data.

2. **Data Query**
   - The GraphQL endpoint enables users to fetch:
     - Personal information
     - Recent projects
     - Progress statistics (XP & audit ratio)
     - Best skills
     - Technological skills

3. **Data Visualization**
   - User progress and skills are displayed using SVG charts.

4. **Logout Functionality**
   - The logout button ends the user session and redirects to the login page.

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd <project-directory>
   ```

3. Open the project in a browser:
   - Open `index.html` directly or serve it through a live server.

## Usage
1. Log in with your credentials to access the dashboard.
2. Explore the dashboard to view your information, projects, and progress.
3. Click the logout button to securely end your session.

## hosting
the Project is also hosted on
https://omar-abk.github.io/

---
Project Owner:
Omar Albinkhalil (ok)

We hope this project helps users visualize their data effectively and inspires further development!


