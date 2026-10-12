# 🚀 Jenkins CI/CD Mini Project: Task Tracker Service

A hands-on, production-grade mini project demonstrating end-to-end **Continuous Integration (CI)** and **Continuous Deployment (CD)** using **Jenkins** and **Node.js**.

---

## 📌 1. CI/CD & Jenkins Fundamentals

### What is CI/CD?
- **CI (Continuous Integration):** Developers commit code frequently into a shared repository (e.g., GitHub, GitLab). Every commit triggers an automated pipeline that checks out code, installs dependencies, validates syntax/formatting (linting), and runs automated tests. Bugs are caught in minutes rather than days.
- **CD (Continuous Delivery / Deployment):**
  - *Continuous Delivery:* The pipeline automatically packages verified artifacts (`.zip`, `.tar.gz`, or Docker images) ready to be deployed to production with one-click approval.
  - *Continuous Deployment:* Every validated build automatically deploys straight to staging or production without human intervention, verified by automated smoke/health-check tests.

### Why Jenkins?
Jenkins is the open-source automation server industry standard. It coordinates the lifecycle of code through a **`Jenkinsfile`** (Pipeline as Code).

```
   ┌─────────────────────────────────────────────────────────────┐
   │                     CI/CD PIPELINE FLOW                     │
   └─────────────────────────────────────────────────────────────┘
  [ Developer ] ──> git push ──> [ GitHub / Local Git ]
                                          │ Webhook / Poll
                                          ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                       JENKINS PIPELINE                      │
   │                                                             │
   │  [Stage 1: Checkout]                                        │
   │          │                                                  │
   │  [Stage 2: Install Dependencies] (npm install)              │
   │          │                                                  │
   │  [Stage 3: Lint & Code Quality]  (npm run lint)             │
   │          │                                                  │
   │  [Stage 4: Automated Testing]    (npm test)                 │
   │          │                                                  │
   │  [Stage 5: Build & Package]      (npm run build -> /dist)   │
   │          │                                                  │
   │  [Stage 6: Deploy & Smoke Test]  (npm run deploy:mock)      │
   │          │                                                  │
   │  [Post: Archive Artifacts & Notify Team]                    │
   └─────────────────────────────────────────────────────────────┘
```

---

## 📂 2. Project Structure

```text
jenkins-cicd-mini-project/
├── .gitignore               # Ignores node_modules, build outputs, and logs
├── Dockerfile               # Production container definition with healthcheck
├── Jenkinsfile              # Declarative multi-stage Jenkins pipeline
├── package.json             # Scripts (ci, test, lint, build, deploy)
├── run-pipeline.bat         # 1-click Windows batch script replicating Jenkins
├── src/
│   ├── app.js               # Express API (/api/health, /api/tasks)
│   └── server.js            # App entrypoint
├── tests/
│   └── app.test.js          # Unit & integration tests (Node native test runner)
└── scripts/
    ├── lint.js              # AST/syntax validator for CI
    ├── build.js             # Generates dist/ package and build-info.json metadata
    └── deploy.js            # Deploys and executes live health smoke check
```

---

## ⚡ 3. Quickstart (Test Locally Without Jenkins First)

Before running in Jenkins, you can test every pipeline stage locally on your machine:

```powershell
# Navigate into the project folder
cd "C:\Users\Mir Shujath Ali\.gemini\antigravity\scratch\jenkins-cicd-mini-project"

# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Run full CI pipeline (Lint -> Test -> Build)
npm run ci

# 4. Run CD Deployment simulation with live smoke check
npm run deploy:mock

# 5. OR run the 1-click pipeline simulation script
.\run-pipeline.bat
```

---

## 🛠️ 4. Setting Up Jenkins

You have two simple options to run Jenkins on your Windows machine:

### Option A: Run Jenkins via Java (.war file) — Recommended if Docker is not installed
1. Download OpenJDK 17 or 21 if you don't already have Java:
   - Check via `java -version`
2. Download Jenkins Generic Java package (`jenkins.war`) from [jenkins.io/download](https://www.jenkins.io/download/):
   ```powershell
   # Move to a dedicated folder and run
   java -jar jenkins.war --httpPort=8080
   ```
3. Open your browser at `http://localhost:8080`.
4. Copy the initial administrator password printed in your terminal or from:
   `C:\Users\<YourUser>\.jenkins\secrets\initialAdminPassword`
5. Select **"Install suggested plugins"** and create your admin account.

### Option B: Run Jenkins in Docker (Once Docker Desktop is installed)
```powershell
docker run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts
```

---

## 🏗️ 5. Creating Your Jenkins Pipeline Job

Once logged into Jenkins (`http://localhost:8080`):

1. **Create New Item:**
   - Click **"New Item"** on the left dashboard.
   - Enter name: `task-tracker-cicd`.
   - Select **"Pipeline"** and click **OK**.

2. **Configure Pipeline Definition:**
   - Scroll down to the **Pipeline** section.
   - In the **Definition** dropdown:
     - **If using Git/GitHub:** Select **Pipeline script from SCM**, choose **Git**, paste your repository URL, set branch to `*/main`, and Script Path to `Jenkinsfile`.
     - **If running directly from local disk (Quick Test):** Select **Pipeline script**, and copy the contents of the [`Jenkinsfile`](file:///C:/Users/Mir%20Shujath%20Ali/.gemini/antigravity/scratch/jenkins-cicd-mini-project/Jenkinsfile) into the box.

3. **Run the Pipeline:**
   - Click **"Save"**.
   - Click **"Build Now"** on the left menu.
   - Watch the **Stage View** turn green step by step:
     - `Checkout` ➔ `Install Dependencies` ➔ `Lint & Code Quality` ➔ `Automated Tests` ➔ `Build & Package` ➔ `Deploy to Staging`.

4. **Verify Artifacts:**
   - Click on the build number (e.g., `#1`).
   - Under **Build Artifacts**, you will see `dist/build-info.json` archived and downloadable!

---

## 🧪 6. Testing Pipeline Failure & Healing (Self-Learning Exercise)

To understand how CI protects production:
1. Open [`tests/app.test.js`](file:///C:/Users/Mir%20Shujath%20Ali/.gemini/antigravity/scratch/jenkins-cicd-mini-project/tests/app.test.js) and intentionally change an expectation:
   ```javascript
   // Change 200 to 500
   assert.equal(res.status, 500);
   ```
2. Run `npm test` or trigger **"Build Now"** in Jenkins.
3. Observe how Jenkins detects the failing test, aborts the pipeline at **Stage 4 (Automated Tests)**, prevents the **Deploy** stage from ever executing, and flags the build as **RED ❌**.
4. Revert the test to `200` and build again — Jenkins recovers to **GREEN ✅**!
