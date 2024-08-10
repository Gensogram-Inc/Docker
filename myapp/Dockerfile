# Use the official Tomcat image
FROM tomcat:10.1.26

# Copy the WAR file to the webapps directory
COPY target/myapp-1.0-SNAPSHOT.war /usr/local/tomcat/webapps/myapp.war

# Expose the default HTTP port
EXPOSE 8080

# Start Tomcat
CMD ["catalina.sh", "run"]
