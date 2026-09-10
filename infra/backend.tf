# Stato remoto di LifeCouple — SEPARATO da quello di HeleoX.
#
# Il bucket e' lo stesso (esiste gia', creato a mano per HeleoX: vedi
# HeleoX/infra/envs/dev/backend.tf), ma la CHIAVE e' diversa. Chiave diversa
# = file di stato diverso = nessuna interferenza: un `terraform destroy`
# sbagliato dentro l'ambiente dev di HeleoX non puo' toccare queste risorse,
# e un apply qui non richiede di pianificare l'intera piattaforma di HeleoX.
#
# Perche' non un modulo dentro HeleoX/infra/envs/dev: quelle sono le pagine
# legali PUBBLICHE di un prodotto, che gli store pretendono raggiungibili.
# Farle dipendere dallo stato dell'ambiente DEV di un altro prodotto sarebbe
# sbagliato su due assi insieme -- prodotto e ambiente. Ogni progetto e'
# autonomo (CLAUDE.md 4.1), e la sua infrastruttura vive nel suo repo.
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket       = "heliox-terraform-state-790304250429"
    key          = "lifecouple/terraform.tfstate"
    region       = "eu-west-1"
    use_lockfile = true
    encrypt      = true
  }
}

# CloudFront accetta certificati SOLO da us-east-1, ovunque viva il resto
# dell'infrastruttura. Non e' una preferenza: e' un vincolo del servizio, e
# per questo serve un secondo provider con alias invece di cambiare regione.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "LifeCouple"
      ManagedBy = "Terraform"
    }
  }
}

provider "aws" {
  region = "eu-west-1"

  default_tags {
    tags = {
      Project   = "LifeCouple"
      ManagedBy = "Terraform"
    }
  }
}
