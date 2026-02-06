# Use Eclipse Temurin JDK 17 Alpine base
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy built jar
COPY target/payment-service-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8082

# Run the jar
ENTRYPOINT ["java","-jar","app.jar"]
