import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  public async ping(pipelineType: 'video' | 'image' | 'audio' | 'pdf') {
    if (!navigator.onLine) {
      console.log('Telemetry skipped: Browser reports offline.');
      return;
    }

    try {
      fetch('https://telemetry-worker.fadytawadrous3.workers.dev/status-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline: pipelineType }),
        keepalive: true
      });
    } catch (e) {
      console.error('Telemetry fetch failed:', e);
    }
  }
}