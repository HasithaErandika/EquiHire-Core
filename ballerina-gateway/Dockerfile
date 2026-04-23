# ===========================================================================
# ballerina-gateway/Dockerfile
# Multi-stage build for the EquiHire Ballerina Gateway.
#
# Stage 1 (builder): Compiles the Ballerina project into a JAR distribution.
# Stage 2 (runtime): Runs the compiled artifact on a slim JRE image.
# ===========================================================================

# --- Stage 1: Build ---
FROM ballerina/ballerina:2201.13.1 AS builder

WORKDIR /home/ballerina/app

# Copy the full project source
COPY . .

# Compile into a self-contained distribution
RUN bal build --target-dir /home/ballerina/dist

# --- Stage 2: Runtime ---
FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL org.opencontainers.image.title="EquiHire Gateway"
LABEL org.opencontainers.image.description="Ballerina HTTP gateway for the EquiHire AI-native blind assessment platform"
LABEL org.opencontainers.image.source="https://github.com/EquiHire/EquiHire-Core"

WORKDIR /app

# Copy the compiled distribution from the builder stage
COPY --from=builder /home/ballerina/dist /app/dist
COPY --from=builder /home/ballerina/app/Config.toml /app/Config.toml

EXPOSE 9092

# Start the gateway using the generated executable JAR
ENTRYPOINT ["sh", "-c", "java -jar /app/dist/bin/gateway.jar"]
