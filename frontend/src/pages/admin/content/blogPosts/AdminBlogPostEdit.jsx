import { Navigate, useParams } from "react-router-dom";

import BlogPostForm from "../../../../components/admin/blog/posts/BlogPostForm";

const AdminBlogPostEdit = () => {
    const { id } = useParams();

    if (!id) {
        return (
            <Navigate
                to="/admin/content/blog-posts"
                replace
            />
        );
    }

    return (
        <BlogPostForm
            mode="edit"
            postId={id}
        />
    );
};

export default AdminBlogPostEdit;