pipeline {
    agent any

    environment {
        DEPLOY_ENV = 'staging'
        APP_NAME = 'jenkins-cicd-mini-project'
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 [Stage 1] Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 [Stage 2] Installing application dependencies...'
                script {
                    if (isUnix()) {
                        sh 'npm install --prefer-offline --no-audit'
                    } else {
                        bat 'npm install --prefer-offline --no-audit'
                    }
                }
            }
        }

        stage('Lint & Code Quality') {
            steps {
                echo '🔍 [Stage 3] Checking code syntax & standards...'
                script {
                    if (isUnix()) {
                        sh 'npm run lint'
                    } else {
                        bat 'npm run lint'
                    }
                }
            }
        }

        stage('Automated Tests') {
            steps {
                echo '🧪 [Stage 4] Running unit and integration tests...'
                script {
                    if (isUnix()) {
                        sh 'npm test'
                    } else {
                        bat 'npm test'
                    }
                }
            }
        }

        stage('Build & Package') {
            steps {
                echo '🏗️ [Stage 5] Building production artifact...'
                script {
                    if (isUnix()) {
                        sh 'npm run build'
                    } else {
                        bat 'npm run build'
                    }
                }
            }
        }

        stage('Deploy to Staging') {
            steps {
                echo '🚀 [Stage 6] Deploying to Staging environment & running smoke test...'
                script {
                    if (isUnix()) {
                        sh 'npm run deploy:mock'
                    } else {
                        bat 'npm run deploy:mock'
                    }
                }
            }
        }
    }

    post {
        always {
            echo '📋 Pipeline execution completed.'
            // Archive build output for download in Jenkins Web UI
            archiveArtifacts artifacts: 'dist/**', fingerprint: true, allowEmptyArchive: true
        }
        success {
            echo '🎉 SUCCESS: Build #${BUILD_NUMBER} completed without errors!'
        }
        failure {
            echo '🚨 FAILURE: Build #${BUILD_NUMBER} failed. Check console logs for details.'
        }
    }
}
