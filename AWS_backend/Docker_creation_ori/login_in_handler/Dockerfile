FROM python:3.9

# Install zip utility
RUN apt-get update && apt-get install -y zip

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt --target /app/packages

COPY . .

CMD ["bash"]