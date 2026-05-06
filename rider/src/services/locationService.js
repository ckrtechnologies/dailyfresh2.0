import BackgroundJob from 'react-native-background-actions';
import Geolocation from '@react-native-community/geolocation';
import api from './api';

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

const taskOptions = {
    taskName: 'RiderLocationTask',
    taskTitle: 'Daily Fresh Rider',
    taskDesc: 'Sharing live location for active deliveries',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#10b981',
    parameters: {
        delay: 60000, // 1 minute
    },
};

class LocationService {
    isRunning = false;

    async startTracking() {
        if (this.isRunning) return;
        
        try {
            await BackgroundJob.start(this.locationTask, taskOptions);
            this.isRunning = true;
            console.log('[LocationService] Background tracking started');
        } catch (e) {
            console.error('[LocationService] Error starting background task:', e);
        }
    }

    async stopTracking() {
        if (!this.isRunning) return;
        
        try {
            await BackgroundJob.stop();
            this.isRunning = false;
            console.log('[LocationService] Background tracking stopped');
        } catch (e) {
            console.error('[LocationService] Error stopping background task:', e);
        }
    }

    locationTask = async (taskData) => {
        await new Promise(async (resolve) => {
            while (BackgroundJob.isRunning()) {
                Geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                            if (!latitude || !longitude) return;
                            await api.patch('/rider/location', {
                                latitude,
                                longitude
                            });
                            console.log(`[LocationService] Updated: ${latitude}, ${longitude}`);
                        } catch (err) {
                            console.log('[LocationService] Sync Error:', err.message);
                        }
                    },
                    (error) => console.error('[LocationService] GPS Error:', error),
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                );
                await sleep(taskData.delay);
            }
        });
    };
}

export default new LocationService();
