FROM eclipse-temurin:17-jre-alpine
EXPOSE 8761
COPY target/*.jar eureka-server.jar
ENTRYPOINT ["java","-jar","/eureka-server.jar"]