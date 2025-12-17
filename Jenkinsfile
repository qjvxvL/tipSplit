pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Node Version') {
      steps {
        bat 'node -v'
        bat 'npm -v'
      }
    }

    stage('Install') {
      steps {
        // butuh package-lock.json biar stabil
        bat 'npm ci'
      }
    }

    stage('Lint') {
      steps {
        bat 'npm run lint --if-present'
      }
    }

    stage('Test') {
      steps {
        bat 'npm test --if-present'
      }
    }

    stage('Build') {
      steps {
        bat 'npm run build'
      }
    }
  }

  post {
    always {
      echo 'Done.'
    }
  }
}
