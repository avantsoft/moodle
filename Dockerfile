FROM bitnami/minideb-extras:stretch-r288
LABEL maintainer "Bitnami <containers@bitnami.com>"

# Install required system packages and dependencies
RUN install_packages cron libbz2-1.0 libc6 libcomerr2 libcurl3 libexpat1 libffi6 libfreetype6 libgcc1 libgcrypt20 libgmp10 libgnutls30 libgpg-error0 libgssapi-krb5-2 libhogweed4 libicu57 libidn11 libidn2-0 libjpeg62-turbo libk5crypto3 libkeyutils1 libkrb5-3 libkrb5support0 libldap-2.4-2 liblzma5 libmcrypt4 libmemcached11 libmemcachedutil2 libncurses5 libnettle6 libnghttp2-14 libp11-kit0 libpcre3 libpng16-16 libpq5 libpsl5 libreadline7 librtmp1 libsasl2-2 libsqlite3-0 libssh2-1 libssl1.0.2 libssl1.1 libstdc++6 libsybdb5 libtasn1-6 libtidy5 libtinfo5 libunistring0 libxml2 libxslt1.1 zlib1g
RUN bitnami-pkg unpack apache-2.4.38-1 --checksum 05c93df10a6e9fc17ee5f810045d80276fb394c1795667917f941d34c9f446e2
RUN bitnami-pkg unpack php-7.1.26-4 --checksum f754253881b698526840265dcbed1e77ef170fd74aa89c4bf2c5b1c8477061c9
RUN bitnami-pkg unpack mysql-client-10.2.22-0 --checksum 6ad851ee27c7cb10ed003d249c8094a85462ae90ef8b4145a3480c29fdfb31a9
RUN bitnami-pkg unpack libphp-7.1.26-2 --checksum 432d5083f0ab5559aa417caeae4de3e69c26516cce4b5d096fc2e3c442c48af7

# RUN mkdir -p /tmp/moodle/moodle-linux-amd64-debian-9
COPY ./bitnami/build /tmp/moodle/
COPY . /tmp/moodle/files/moodle/
# RUN ls -la /tmp/moodle/
RUN cd /tmp/moodle/ && tar -czf ../../moodle-3.6.2-1-linux-amd64-debian-9.tar.gz . && cd ../../
RUN tar -tvf moodle-3.6.2-1-linux-amd64-debian-9.tar.gz
RUN mkdir -p /tmp/bitnami/pkg/install/moodle-3.6.2-1-linux-amd64-debian-9/
RUN tar -C /tmp/bitnami/pkg/install/moodle-3.6.2-1-linux-amd64-debian-9/ -xzf moodle-3.6.2-1-linux-amd64-debian-9.tar.gz  
# RUN ls -la  /tmp/bitnami/pkg/install/moodle-3.6.2-1-linux-amd64-debian-9/
# RUN ls -la 
RUN mkdir -p /tmp/bitnami/pkg/cache
RUN mv moodle-3.6.2-1-linux-amd64-debian-9.tar.gz /tmp/bitnami/pkg/cache/
# RUN ls -la /tmp/bitnami/pkg/cache/
RUN bitnami-pkg unpack moodle-3.6.2-1


RUN mkdir -p /opt/bitnami/apache/tmp && chmod g+rwX /opt/bitnami/apache/tmp
RUN sed -i -e '/pam_loginuid.so/ s/^#*/#/' /etc/pam.d/cron
RUN ln -sf /dev/stdout /opt/bitnami/apache/logs/access_log
RUN ln -sf /dev/stderr /opt/bitnami/apache/logs/error_log

COPY rootfs /
ENV ALLOW_EMPTY_PASSWORD="no" \
    APACHE_HTTPS_PORT_NUMBER="443" \
    APACHE_HTTP_PORT_NUMBER="80" \
    BITNAMI_APP_NAME="moodle" \
    BITNAMI_IMAGE_VERSION="3.6.2-debian-9-r30" \
    MARIADB_HOST="mariadb" \
    MARIADB_PORT_NUMBER="3306" \
    MARIADB_ROOT_PASSWORD="" \
    MARIADB_ROOT_USER="root" \
    MOODLE_DATABASE_NAME="bitnami_moodle" \
    MOODLE_DATABASE_PASSWORD="" \
    MOODLE_DATABASE_USER="bn_moodle" \
    MOODLE_EMAIL="user@example.com" \
    MOODLE_LANGUAGE="en" \
    MOODLE_PASSWORD="bitnami" \
    MOODLE_SITENAME="New Site" \
    MOODLE_USERNAME="user" \
    MYSQL_CLIENT_CREATE_DATABASE_NAME="" \
    MYSQL_CLIENT_CREATE_DATABASE_PASSWORD="" \
    MYSQL_CLIENT_CREATE_DATABASE_PRIVILEGES="ALL" \
    MYSQL_CLIENT_CREATE_DATABASE_USER="" \
    PATH="/opt/bitnami/apache/bin:/opt/bitnami/php/bin:/opt/bitnami/php/sbin:/opt/bitnami/mysql/bin:$PATH" \
    SMTP_HOST="" \
    SMTP_PASSWORD="" \
    SMTP_PORT="" \
    SMTP_PROTOCOL="" \
    SMTP_USER=""

EXPOSE 80 443

ENTRYPOINT [ "/app-entrypoint.sh" ]
CMD [ "/run.sh" ]