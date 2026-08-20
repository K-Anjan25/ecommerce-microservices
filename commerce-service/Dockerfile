# syntax=docker/dockerfile:1
# Build context = repository root (docker-compose sets it). Builds the module in
# the multi-module reactor so common/event-bus are resolved automatically.
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /workspace
COPY pom.xml .
COPY common common
COPY event-bus event-bus
COPY product-service product-service
COPY commerce-service commerce-service
COPY user-service user-service
COPY api-gateway api-gateway
RUN mvn -q -pl commerce-service -am -Dmaven.test.skip=true package

FROM eclipse-temurin:17-jre-alpine
EXPOSE 8081
COPY --from=builder /workspace/commerce-service/target/*.jar app.jar
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app.jar"]
