interface CrashReport {
  error: Error;
  errorInfo?: any;
  userId?: string;
  timestamp: string;
  platform: string;
  version: string;
  additionalInfo?: Record<string, any>;
}

class CrashReporter {
  private static instance: CrashReporter;
  private isEnabled: boolean = true;
  private userId?: string;

  private constructor() {}

  public static getInstance(): CrashReporter {
    if (!CrashReporter.instance) {
      CrashReporter.instance = new CrashReporter();
    }
    return CrashReporter.instance;
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public reportError(error: Error, errorInfo?: any, additionalInfo?: Record<string, any>) {
    if (!this.isEnabled) return;

    const crashReport: CrashReport = {
      error,
      errorInfo,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      platform: 'react-native',
      version: '1.0.0',
      additionalInfo,
    };

    // Log to console in development
    if (__DEV__) {
      console.error('Crash Report:', crashReport);
      console.error('Error Stack:', error.stack);
    }

    // In production, you would send this to your crash reporting service
    // Example: Sentry, Bugsnag, Firebase Crashlytics, etc.
    this.sendCrashReport(crashReport);
  }

  public reportCrash(error: Error, errorInfo?: any) {
    this.reportError(error, errorInfo, { type: 'crash' });
  }

  public reportWarning(message: string, additionalInfo?: Record<string, any>) {
    if (!this.isEnabled) return;

    const warning = {
      message,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      additionalInfo,
    };

    if (__DEV__) {
      console.warn('Warning Report:', warning);
    }

    // Send warning to analytics service
    this.sendWarningReport(warning);
  }

  private async sendCrashReport(crashReport: CrashReport) {
    try {
      // Store locally first
      await this.storeLocalCrashReport(crashReport);

      // TODO: Send to crash reporting service
      // Example:
      // await fetch('https://your-crash-reporting-service.com/crashes', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(crashReport),
      // });
    } catch (error) {
      console.error('Failed to send crash report:', error);
    }
  }

  private async sendWarningReport(warning: any) {
    try {
      // Store locally first
      await this.storeLocalWarning(warning);

      // TODO: Send to analytics service
    } catch (error) {
      console.error('Failed to send warning report:', error);
    }
  }

  private async storeLocalCrashReport(crashReport: CrashReport) {
    try {
      // Store crash reports locally for offline scenarios
      // You can use AsyncStorage or a local database
      const key = `crash_${crashReport.timestamp}`;
      // await AsyncStorage.setItem(key, JSON.stringify(crashReport));
    } catch (error) {
      console.error('Failed to store crash report locally:', error);
    }
  }

  private async storeLocalWarning(warning: any) {
    try {
      const key = `warning_${warning.timestamp}`;
      // await AsyncStorage.setItem(key, JSON.stringify(warning));
    } catch (error) {
      console.error('Failed to store warning locally:', error);
    }
  }

  public logEvent(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event = {
      name: eventName,
      properties,
      timestamp: new Date().toISOString(),
      userId: this.userId,
    };

    if (__DEV__) {
      console.log('Event:', event);
    }

    // TODO: Send to analytics service
  }

  public logPerformance(metric: string, value: number, unit: string = 'ms') {
    if (!this.isEnabled) return;

    const performance = {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
      userId: this.userId,
    };

    if (__DEV__) {
      console.log('Performance:', performance);
    }

    // TODO: Send to performance monitoring service
  }
}

export default CrashReporter.getInstance(); 