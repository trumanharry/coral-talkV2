# Coral Talk Development Setup in GitHub Codespaces

**Complete Step-by-Step Implementation Guide**

*Based on successful implementation and troubleshooting of Coral Talk v9+ in GitHub Codespaces*

---

## 🎯 What You'll Achieve

By following this guide, you'll have:
- ✅ **Coral Talk running in GitHub Codespaces**
- ✅ **Hot reloading development environment**  
- ✅ **All services connected** (MongoDB + Redis)
- ✅ **Access to admin interface and commenting system**
- ✅ **No local setup required** - everything runs in the cloud

---

## 📋 Prerequisites

- GitHub account with Codespaces access (Pro plan or organization account)
- Forked copy of the Coral Talk repository
- Basic familiarity with command line and Docker

---

## ⚠️ Important Note: Why Direct Source Building Fails

**Memory Limitation Discovery**: Attempting to build Coral Talk from source in GitHub Codespaces consistently fails due to JavaScript heap memory exhaustion during the TypeScript/React compilation process. Even with 8GB Codespace machines, the build process requires more memory than available.

**The Working Solution**: Use pre-built Docker images with volume mounting for development - this bypasses the memory-intensive build step while still providing full development capabilities.

---

## 🚀 Step-by-Step Implementation

### Step 1: Fork the Repository

1. Navigate to https://github.com/coralproject/talk
2. Click the "Fork" button in the top-right
3. Choose your GitHub account as the destination
4. Wait for the fork to complete

### Step 2: Create Development Configuration Files

#### 2.1 Create `.devcontainer/devcontainer.json`

In your forked repository on GitHub:

1. Click "Add file" → "Create new file"
2. Name: `.devcontainer/devcontainer.json`
3. Content:

```json
{
  "name": "coral-talk-dev",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "forwardPorts": [3000, 5000, 27017, 6379],
  "portsAttributes": {
    "3000": {
      "label": "Coral Server",
      "onAutoForward": "notify"
    },
    "5000": {
      "label": "Coral App",
      "onAutoForward": "openPreview"
    },
    "27017": {
      "label": "MongoDB",
      "onAutoForward": "ignore"
    },
    "6379": {
      "label": "Redis",
      "onAutoForward": "ignore"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-vscode.vscode-typescript-next",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-json",
        "GraphQL.vscode-graphql"
      ]
    }
  }
}
```

4. Commit the file

#### 2.2 Create `docker-compose.yml`

1. Create file: `docker-compose.yml`
2. Content:

```yaml
services:
  talk:
    image: coralproject/talk:9
    restart: always
    ports:
      - "3000:3000"
      - "5000:5000"
    depends_on:
      - mongo
      - redis
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/coral
      - REDIS_URI=redis://redis:6379
      - SIGNING_SECRET=dev-secret-change-me-in-production
      - ROOT_URL=http://localhost:5000
    volumes:
      - ./server:/app/server
      - ./client:/app/client
      - ./common:/app/common
    
  mongo:
    image: mongo:8.0.3
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
      
  redis:
    image: redis:7.2.5
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```

3. Commit the file

### Step 3: Launch GitHub Codespace

1. Go to your forked repository
2. Click the green "Code" button
3. Click "Codespaces" tab
4. Click "Create codespace on main"
5. **Select 4-core machine** (8GB RAM) - this is important for performance
6. Wait 2-5 minutes for initialization

### Step 4: Start the Development Environment

#### 4.1 Clean Up Any Existing Containers

```bash
# Stop any existing containers
docker stop $(docker ps -aq) 2>/dev/null || true
```

#### 4.2 Start Coral Talk with Docker Compose

```bash
# Start all services
docker-compose up -d

# Verify all containers are running
docker-compose ps
```

**Expected Output:**
```
NAME                   IMAGE                 COMMAND                  SERVICE   CREATED         STATUS         PORTS
coral-talkv2-mongo-1   mongo:8.0.3          "docker-entrypoint.s…"   mongo     X minutes ago   Up X minutes   0.0.0.0:27017->27017/tcp
coral-talkv2-redis-1   redis:7.2.5          "docker-entrypoint.s…"   redis     X minutes ago   Up X minutes   0.0.0.0:6379->6379/tcp
coral-talkv2-talk-1    coralproject/talk:9  "docker-entrypoint.s…"   talk      X minutes ago   Up X minutes   0.0.0.0:3000->3000/tcp, 0.0.0.0:5000->5000/tcp
```

All containers should show "Up" status.

#### 4.3 Monitor Startup (Optional)

```bash
# Watch Coral Talk logs during startup
docker-compose logs -f talk
```

Wait until you see messages indicating successful startup (MongoDB and Redis connections established).

### Step 5: Access Your Development Environment

#### 5.1 Check Forwarded Ports

1. In VS Code, look for the "PORTS" tab (next to Terminal)
2. You should see ports 3000, 5000, 27017, and 6379 forwarded
3. All should show green dots indicating they're running

#### 5.2 Access Coral Talk

**Important**: Use **port 5000**, not 3000 for the main application.

1. Click the **globe icon next to port 5000** in the Ports tab
2. This will open Coral Talk in your browser
3. You should see the Coral installation wizard

### Step 6: Complete Coral Installation

#### 6.1 Setup Wizard

1. Fill out the installation form:
   - **Organization Name**: Your choice (e.g., "Dev Organization")
   - **Admin Email**: Your email address
   - **Admin Password**: Choose a secure password
   - **Site URL**: Should auto-populate with your Codespace URL

2. Complete the setup process

#### 6.2 Access Admin Panel

After setup:
- **Main Application**: Use port 5000 URL
- **Admin Interface**: Add `/admin` to your port 5000 URL
- **API Endpoint**: Available on port 3000

---

## 🔧 Development Workflow

### Hot Reloading

**Source Code Editing:**
- Edit files in `/server`, `/client`, or `/common` directories
- Changes are automatically reflected due to volume mounts
- The pre-built image handles compilation internally

### Useful Commands

```bash
# View all container logs
docker-compose logs

# View specific service logs
docker-compose logs talk
docker-compose logs mongo
docker-compose logs redis

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Start services again
docker-compose up -d

# View container status
docker-compose ps
```

### Database Access

**MongoDB:**
```bash
# Access MongoDB shell
docker exec -it coral-talkv2-mongo-1 mongosh coral
```

**Redis:**
```bash
# Access Redis CLI
docker exec -it coral-talkv2-redis-1 redis-cli
```

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. "This page isn't working" - HTTP 502 Error

**Solution**: Use port 5000 instead of port 3000 for the main application.

#### 2. Containers Keep Restarting

```bash
# Check logs for errors
docker-compose logs talk

# Common fix - restart everything
docker-compose down
docker-compose up -d
```

#### 3. Memory Issues During Startup

- Ensure you're using a 4-core Codespace machine
- If using 2-core machine, upgrade via Codespace settings

#### 4. Port Not Accessible

```bash
# Make ports public in terminal
gh codespace ports visibility 5000:public --codespace $CODESPACE_NAME
```

#### 5. Database Connection Errors

```bash
# Verify all containers are running
docker-compose ps

# Restart databases
docker-compose restart mongo redis
```

### Advanced Troubleshooting

#### Container Shell Access

```bash
# Access Coral Talk container
docker exec -it coral-talkv2-talk-1 /bin/bash

# Check application status inside container
ps aux | grep node
```

#### Clean Restart

```bash
# Complete reset
docker-compose down --volumes
docker-compose up -d
```

---

## 📊 Performance Optimization

### Codespace Machine Recommendations

- **Minimum**: 4-core (8GB RAM)
- **Recommended**: 8-core (16GB RAM) for larger development work
- **Upgrade Path**: Can be changed in Codespace settings

### Resource Monitoring

```bash
# Monitor resource usage
docker stats

# Check available disk space
df -h

# Monitor memory usage
free -h
```

---

## 🎯 Development Tips

### 1. Code Organization

- **Server Code**: `/server` directory - API, GraphQL, backend logic
- **Client Code**: `/client` directory - React frontend components  
- **Common Code**: `/common` directory - Shared utilities and types

### 2. Environment Variables

Key environment variables you can modify in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=development          # Enable development features
  - MONGODB_URI=mongodb://mongo:27017/coral
  - REDIS_URI=redis://redis:6379
  - SIGNING_SECRET=your-secret-here
  - ROOT_URL=http://localhost:5000
```

### 3. Plugin Development

- Coral supports plugin architecture
- Plugin files typically in `/server/src/core/server/plugins`
- Restart container after plugin changes: `docker-compose restart talk`

### 4. Database Persistence

- Data persists between container restarts via Docker volumes
- To reset database: `docker-compose down --volumes`

---

## 🔒 Security Considerations

### Development vs Production

**This setup is for DEVELOPMENT ONLY**

For production deployment:
- Change `SIGNING_SECRET` to a cryptographically secure random string
- Use proper MongoDB and Redis credentials  
- Set up SSL/TLS certificates
- Configure proper firewall rules
- Use environment-specific configurations

### Secure Secret Generation

```bash
# Generate secure signing secret
openssl rand -base64 48
```

---

## 📚 Additional Resources

### Official Documentation
- [Coral Documentation](https://docs.coralproject.net/)
- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

### Community Resources
- [Coral GitHub Repository](https://github.com/coralproject/talk)
- [Coral Community Forum](https://coral.discourse.group/)

---

## ✅ Success Verification

Your setup is working correctly when:

1. ✅ All containers show "Up" status in `docker-compose ps`
2. ✅ Port 5000 URL opens Coral Talk interface
3. ✅ You can complete the installation wizard
4. ✅ Admin panel is accessible at `/admin` route
5. ✅ You can make code changes and see them reflected

---

## 🎉 Conclusion

You now have a fully functional Coral Talk development environment running in GitHub Codespaces! This setup provides:

- **Zero local configuration** required
- **Full development capabilities** with hot reloading
- **Professional database setup** with MongoDB and Redis
- **Scalable cloud infrastructure** via Codespaces
- **Collaborative development** - share Codespace URLs with team members

The key insight that made this work was using pre-built Docker images instead of attempting source compilation, which bypasses the memory limitations inherent in cloud development environments.

Happy developing with Coral Talk! 🚀

---

*Guide created based on successful implementation in GitHub Codespaces - December 2024*
