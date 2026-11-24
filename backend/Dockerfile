FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /workspace
ARG MODULE
COPY pom.xml ./pom.xml
COPY service-registry ./service-registry
COPY api-gateway ./api-gateway
COPY auth-service ./auth-service
COPY catalog-service ./catalog-service
COPY request-service ./request-service
COPY incident-service ./incident-service
COPY servicenow-integration ./servicenow-integration
RUN mvn -B -pl ${MODULE} -am -DskipTests package

FROM eclipse-temurin:25-jre
ARG MODULE
WORKDIR /app
COPY --from=build /workspace/${MODULE}/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
