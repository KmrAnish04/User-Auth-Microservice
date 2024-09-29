

const AsyncHandler = (fn) => {
    return async(req, res, next) => {
        try{ await fn(req, res, next); }
        catch (err){
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message
            })
        }
    }
};


// // or
// const asyncHandler = (requestHandler) => {
//     (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next))
//         .catch( (error) => next(error) );
//     }
// }


module.exports = AsyncHandler;