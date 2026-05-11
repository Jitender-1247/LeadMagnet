import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * NewCampaign.jsx
 * Now redirects to the SequenceBuilder with no campaignId (create mode).
 */
export default function NewCampaign() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/campaigns/new/sequence', { replace: true })
  }, [])

  return null
}