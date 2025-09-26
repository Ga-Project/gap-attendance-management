# Production Security Configuration

## Environment Variables Security

### Required Environment Variables

All sensitive configuration must be stored in environment variables, never in code:

- `SECRET_KEY_BASE`: Rails secret key (generate with `rails secret`)
- `POSTGRES_PASSWORD`: Database password (use strong password)
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `JWT_SECRET`: JWT signing secret (generate random string)

### Environment Variable Generation

```bash
# Generate Rails secret key
docker-compose exec backend rails secret

# Generate JWT secret (32 characters)
openssl rand -hex 32

# Generate strong database password
openssl rand -base64 32
```

## Database Security

### PostgreSQL Configuration

- Use strong passwords for database users
- Limit database connections to application containers only
- Regular database backups with encryption
- Enable connection logging for audit trails

### Data Encryption

- All sensitive data should be encrypted at rest
- Use Rails encrypted credentials for additional secrets
- Consider database-level encryption for PII

## Network Security

### Container Network Isolation

- All services run in isolated Docker network
- Database is not exposed to host network
- Only frontend container exposes public ports

### HTTPS Configuration

For production deployment with HTTPS:

1. Use reverse proxy (nginx/traefik) with SSL certificates
2. Set `RAILS_FORCE_SSL=true` in production
3. Configure HSTS headers
4. Use secure cookies

## Application Security

### CORS Configuration

- Restrict CORS origins to known domains
- Never use wildcard (\*) in production
- Configure proper CORS headers

### Authentication Security

- JWT tokens have reasonable expiration times
- Implement token refresh mechanism
- Use secure HTTP-only cookies where possible
- Implement rate limiting for authentication endpoints

### Input Validation

- All user inputs are validated and sanitized
- Use Rails strong parameters
- Implement CSRF protection
- Validate file uploads if implemented

## Monitoring and Logging

### Security Logging

- Log all authentication attempts
- Log admin actions with audit trails
- Monitor for suspicious activities
- Set up log rotation and retention

### Health Monitoring

- Implement health check endpoints
- Monitor service availability
- Set up alerts for service failures
- Regular security updates

## Backup Security

### Backup Encryption

- Encrypt database backups
- Store backups in secure location
- Test backup restoration regularly
- Implement backup retention policies

### Access Control

- Limit backup access to authorized personnel
- Use separate credentials for backup systems
- Audit backup access logs

## Container Security

### Image Security

- Use official base images
- Keep base images updated
- Scan images for vulnerabilities
- Use multi-stage builds to minimize attack surface

### Runtime Security

- Run containers as non-root users
- Use read-only filesystems where possible
- Limit container capabilities
- Implement resource limits

## Compliance Considerations

### Data Protection

- Implement data retention policies
- Provide data export/deletion capabilities
- Document data processing activities
- Regular security assessments

### Audit Requirements

- Maintain audit logs for all data modifications
- Implement user activity tracking
- Regular compliance reviews
- Document security procedures
