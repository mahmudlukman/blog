const tryCatch = (controller) => {
    return async (req, res, next) => {
      try {
        await controller(req, res, next)
      } catch (error) {
        console.error('Error in controller:', error);
        res.status(500).json({success: false, message: "Something went wrong! try again later"})
      }
    }
  }
  
  export default tryCatch