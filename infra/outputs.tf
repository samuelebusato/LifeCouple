output "bucket" {
  description = "Bucket S3 che ospita i file della landing."
  value       = aws_s3_bucket.landing.id
}

output "distribution_id" {
  description = "ID della distribuzione CloudFront (serve per invalidare la cache dopo ogni sync)."
  value       = aws_cloudfront_distribution.landing.id
}

output "url" {
  description = "Indirizzo pubblico della landing."
  value       = "https://${aws_cloudfront_distribution.landing.domain_name}"
}
