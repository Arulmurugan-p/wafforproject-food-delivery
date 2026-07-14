FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY kitchen-service/pom.xml kitchen-service/
RUN mvn dependency:go-offline -B -f kitchen-service/pom.xml
COPY kitchen-service/src kitchen-service/src
RUN mvn package -DskipTests -f kitchen-service/pom.xml

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/kitchen-service/target/kitchen-service-1.0.0.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
