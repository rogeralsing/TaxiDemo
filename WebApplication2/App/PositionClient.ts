﻿module App {
    export class PositionClient implements IPositionClient {
        private map: google.maps.Map = null;
        private vehicles: MovingVehicle[] = [];
        private order: (vehicle: MovingVehicle) => any;
        private searchText: string = "";

        private includedStateValues: GpsStatus[] = [GpsStatus.active];
        private joinedSources: string[] = [];
        private sources: string[] = [];
        constructor() {
            track(this);
        }

        public initialize = (sources: string[]) => {
            this.sources = sources;
        }

        public get orderedVehicles() {
            return this.vehicles.filter(this.filter)
                .sort((a, b) => a.id > b.id ? 1 : -1);
        }

        private toggleStatus = (status: GpsStatus) => {
            var index = this.includedStateValues.indexOf(status);
            if (index === -1) {
                this.includedStateValues.push(status);
            } else {
                this.includedStateValues.splice(index, 1);
            }
        }

        public isIncluded = (status: GpsStatus) => {
            return this.includedStateValues.indexOf(status) !== -1
        }

        private filter = (vehicle: MovingVehicle) => {
            if (this.isIncluded(vehicle.status) === false) return false;
            if (this.searchText.length > 0) {
                return vehicle.id.indexOf(this.searchText) !== -1;
            }
            return true;
        }

        public initMap = () => {
            var mapOptions = <google.maps.MapOptions>{
                zoom: 13,
                center: new google.maps.LatLng(34.049678, -118.259469) //"Latitude":34.049678,"Longitude":-118.259469
            };
            this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            google.maps.event.addListener(this.map, 'idle',() => {
                this.vehicles.forEach(v => {
                    v.viewPortChanged();
                });
            });
        }

        public positionChanged = (position: IPositionChanged) => {
            var latlng = new google.maps.LatLng(position.Latitude, position.Longitude);

            var vehicle = this.getVehicle(position.RegNr);
            vehicle.setPosition(position.Bearing, latlng, position.GpsStatus);
        };

        //TODO: use dictionary lookup
        public getVehicle = (regNr: string) => {
            var markers = this.vehicles.filter(d => d.id === regNr);
            if (markers.length === 0) {

                var item = new MovingVehicle(regNr, this.map);

                this.vehicles.push(item);
                return item;
            }
            var positionPair = markers[0];

            return positionPair;
        }

        public statusChanged = (taxiStatus: ITaxiStatus) => {
            var vehicle = this.getVehicle(taxiStatus.RegNr);
            vehicle.setStatus(taxiStatus.GpsStatus);
        }
        public sourceAdded = (source: string) => {
            this.sources.push(source);
        }

        public toggleSource = (source: string) => {
            var sourceIndex = this.joinedSources.indexOf(source);
            if (sourceIndex !== -1) {
                this.leaveSource(source);
                this.joinedSources.splice(sourceIndex, 1);
            } else {
                this.joinSource(source);
                this.joinedSources.unshift(source);
            }
        }

        public isSourceJoined = (source: string) => {
            return this.joinedSources.indexOf(source) !== -1;
        }

        public joinSource = (sourceName: string) => { }
        public leaveSource = (sourceName: string) => { }
    }
}