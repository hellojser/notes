import React from "react";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import Seo from "../components/seo";
import { StaticImage } from "gatsby-plugin-image";
import "../styles/about.scss";

const AboutPage = (raw) => {
  const { data, location } = raw;

  return (
    <Layout
      location={location}
      icp={data.site.siteMetadata.icp}
      projectUrl={data.site.siteMetadata.projectUrl}
    >
      <Seo title="About" />
      <div className="about-wrapper">
        <StaticImage
          className="memoji"
          src="../images/memoji_bg.png"
          quality={100}
          placeholder="tracedSVG"
          alt="memoji"
        />
        <div className="accerator glass card">
          <h2 className="title">About Me</h2>
          <div className="content">
            <p>Yoo, I'm Mengyu 👋</p>
            <p>
              Contact me through{" "}
              <a
                alt="mail"
                className="purea"
                href={`mailto:${data.site.siteMetadata.author.mail}`}
              >
                {data.site.siteMetadata.author.mail}
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        icp
        projectUrl
        author {
          name
          mail
        }
      }
    }
  }
`;
