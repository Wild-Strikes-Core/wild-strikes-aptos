export interface MapConfig {
    name: string;
    backgroundKey: string;
    musicKey: string;
    spawnPoints: {
        player1: { x: number; y: number };
        player2: { x: number; y: number };
    };
}

export class ServerMapManager {
    private readonly mapConfigs: MapConfig[] = [
        {
            name: "forest",
            backgroundKey: "newMap",
            musicKey: "in-match",
            spawnPoints: {
                player1: { x: 200, y: 400 },
                player2: { x: 600, y: 400 }
            }
        },
        {
            name: "Philippines",
            backgroundKey: "Philippines", 
            musicKey: "PH-BG",
            spawnPoints: {
                player1: { x: 200, y: 400 },
                player2: { x: 600, y: 400 }
            }
        },
        {
            name: "Japan",
            backgroundKey: "Japan",
            musicKey: "JPN-BG",
            spawnPoints: {
                player1: { x: 200, y: 400 },
                player2: { x: 600, y: 400 }
            }
        },
        {
            name: "France",
            backgroundKey: "France",
            musicKey: "FRN-BG",
            spawnPoints: {
                player1: { x: 200, y: 400 },
                player2: { x: 600, y: 400 }
            }
        }
    ];

    // Randomly selects a map configuration for a new room
    public getRandomMapConfig(): MapConfig {
        const randomIndex = Math.floor(Math.random() * this.mapConfigs.length);
        return this.mapConfigs[randomIndex];
    }

    // Get a specific map by name
    public getMapByName(name: string): MapConfig | undefined {
        return this.mapConfigs.find(map => map.name === name);
    }

    // Get all available maps
    public getAllMaps(): MapConfig[] {
        return [...this.mapConfigs];
    }

    // Validate if a map exists
    public isValidMap(name: string): boolean {
        return this.mapConfigs.some(map => map.name === name);
    }
}
