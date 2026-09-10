output "bucket" {
  description = "Bucket S3 che ospita i file della landing."
  value       = aws_s3_bucket.landing.id
}

output "distribution_id" {
  description = "ID della distribuzione CloudFront (serve per invalidare la cache dopo ogni sync)."
  value       = aws_cloudfront_distribution.landing.id
}

# Il record che una persona deve creare su Cloudflare perche' il certificato
# venga emesso. In Cloudflare il "name" va inserito SENZA il suffisso della
# zona e con proxy DISATTIVATO (nuvoletta grigia).
output "record_di_validazione" {
  description = "CNAME di validazione del certificato, da creare nel DNS."
  value = [for o in aws_acm_certificate.landing.domain_validation_options : {
    nome   = o.resource_record_name
    tipo   = o.resource_record_type
    valore = o.resource_record_value
  }]
}

output "url" {
  description = "Indirizzo pubblico della landing."
  value       = "https://${local.dominio}"
}

output "url_cloudfront" {
  description = "L'indirizzo diretto della distribuzione, sempre valido."
  value       = "https://${aws_cloudfront_distribution.landing.domain_name}"
}
