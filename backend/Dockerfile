FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q -DskipTests package

FROM eclipse-temurin:21-jre
RUN useradd --system --create-home foody && mkdir /data && chown foody /data
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
USER foody
ENV DB_PATH=/data/foody.db
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC -Xss512k"
VOLUME /data
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
