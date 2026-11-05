FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_COUPLE_NAMES="Alex & Jordan"
ARG VITE_WEDDING_DATE="Our wedding day"
ENV VITE_COUPLE_NAMES=$VITE_COUPLE_NAMES VITE_WEDDING_DATE=$VITE_WEDDING_DATE
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
