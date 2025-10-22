# Optimized Dockerfile - giảm dung lượng bằng cách build ngoài Docker
FROM nginx:alpine

# Copy pre-built dist từ local (build ngoài Docker)
COPY dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
