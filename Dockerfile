FROM nginx:alpine

# Copy build files
COPY dist /usr/share/nginx/html

# Copy custom nginx config to handle SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
