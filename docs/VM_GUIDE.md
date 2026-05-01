# VM Guide: FinRisk Production Server

**Server IP:** 167.172.94.125  
**Region:** Singapore (SGP1)  
**Plan:** 1 GiB RAM, 1 vCPU, $6/mo  

---

## Connect to the Server

```bash
ssh root@167.172.94.125
```

---

## App Commands

```bash
# Check containers are running
docker compose -f /finrisk/docker-compose.yml ps

# View live logs (Ctrl+C to stop)
docker compose -f /finrisk/docker-compose.yml logs -f

# View backend logs only
docker compose -f /finrisk/docker-compose.yml logs -f backend

# Restart the app
docker compose -f /finrisk/docker-compose.yml restart

# Stop the app
docker compose -f /finrisk/docker-compose.yml down

# Start the app
docker compose -f /finrisk/docker-compose.yml up -d
```

---

## Deploy an Update

```bash
cd /finrisk
git pull
docker compose up -d --build
```

---

## Database

```bash
# Open SQLite shell directly
sqlite3 /var/lib/docker/volumes/finrisk_db_data/_data/finrisk.db

# Useful queries inside the shell
SELECT * FROM participants;
SELECT * FROM sessions;
SELECT * FROM study_assignments;

# Reset test data (keep assignments)
DELETE FROM tasks;
DELETE FROM sessions;
DELETE FROM participants;
UPDATE study_assignments SET status = 'not_started';

# Exit
.quit
```

> Or run `./open_db_gui_prod.sh` from your Mac for the visual GUI.

---

## Study Setup (first time or after reset)

```bash
# Seed participant assignments P00–P08
curl -s -X POST http://localhost/api/study/assignments/generate-defaults
```

---

## Check a Participant's Assignment

```bash
curl -s http://localhost/api/study/assignments/P01 | python3 -m json.tool
```

---

## Environment Variables

```bash
# View current config (shows keys, not values)
cat /finrisk/.env

# Edit config (restart required after)
nano /finrisk/.env
docker compose -f /finrisk/docker-compose.yml restart backend
```

---

## Disk & Memory

```bash
# Check disk usage
df -h

# Check memory
free -h

# Check Docker image sizes
docker images
```

---

## Destroy the Server (after study)

Export your data first, then destroy the Droplet from the DigitalOcean dashboard. The SQLite DB lives in the Docker volume — back it up before destroying:

```bash
# On your Mac — copy DB locally before destroying
scp root@167.172.94.125:/var/lib/docker/volumes/finrisk_db_data/_data/finrisk.db ./finrisk_study_data.db
```
